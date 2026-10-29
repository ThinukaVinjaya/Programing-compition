import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import { MongoClient } from 'mongodb';

// Ensure standard Google DNS for MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore DNS set errors if restricted
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://thinukavinjayauni_db_user:jwxhfzgI9UZ1JgD8@cluster0.r4abpam.mongodb.net/?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory fallback cache if MongoDB is offline or connecting
let mongoClient = null;
let db = null;
let isConnected = false;
let memoryCompetition = null;
let memoryParticipants = [];
let memoryHistory = [];

async function connectToMongo() {
  try {
    console.log('[MongoDB] Connecting to MongoDB Atlas cluster...');
    mongoClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    await mongoClient.connect();
    db = mongoClient.db('ms_codequest');
    isConnected = true;
    console.log('[MongoDB] Successfully connected to database: ms_codequest');
  } catch (err) {
    isConnected = false;
    console.warn('[MongoDB] Connection notice:', err.message);
    console.log('[MongoDB] Operating in resilient memory & local-persistence mode.');
  }
}

connectToMongo();

// -------------------------------------------------------------
// Auth Route: thinuka / thinuka@123
// -------------------------------------------------------------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const userClean = (username || '').trim().toLowerCase();

  if (
    (userClean === 'thinuka' || userClean === 'thinuka@codequest.org' || userClean === 'admin@codequest.org') &&
    (password === 'thinuka@123' || password === 'CodeQuest2026!')
  ) {
    return res.json({
      success: true,
      user: {
        id: 'admin-thinuka-id',
        username: 'thinuka',
        email: 'thinuka@codequest.org',
        name: 'Thinuka (Competition Director)',
        role: 'super_admin'
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid administrator credentials. Try username: thinuka / password: thinuka@123'
  });
});

// -------------------------------------------------------------
// Get Published Leaderboard
// -------------------------------------------------------------
app.get('/api/leaderboard', async (req, res) => {
  if (isConnected && db) {
    try {
      const comp = await db.collection('competitions').findOne({ status: 'published' }, { sort: { publishedAt: -1 } });
      if (comp) {
        const parts = await db.collection('leaderboard').find({ competitionId: comp.id || comp._id.toString() }).sort({ rank: 1 }).toArray();
        return res.json({
          success: true,
          competition: comp,
          participants: parts,
          isMongo: true,
          publishedAt: comp.publishedAt
        });
      }
    } catch (e) {
      console.warn('[MongoDB] Query failed, falling back:', e.message);
    }
  }

  if (memoryCompetition && memoryParticipants.length > 0) {
    return res.json({
      success: true,
      competition: memoryCompetition,
      participants: memoryParticipants,
      isMongo: isConnected,
      publishedAt: memoryCompetition.publishedAt
    });
  }

  return res.json({
    success: true,
    competition: null,
    participants: [],
    isMongo: isConnected,
    publishedAt: null
  });
});

// -------------------------------------------------------------
// Publish Leaderboard
// -------------------------------------------------------------
app.post('/api/publish', async (req, res) => {
  const { competition, participants, adminUser, fileName } = req.body;

  if (!competition || !participants) {
    return res.status(400).json({ success: false, error: 'Missing competition or participants data' });
  }

  const publishedAt = new Date().toISOString();
  const updatedComp = {
    ...competition,
    status: 'published',
    publishedAt,
    lastUpdatedBy: adminUser?.username || 'thinuka'
  };

  const topWinner = participants[0] || { name: 'N/A', username: 'N/A', score: 0 };
  const highestScore = Math.max(...participants.map(p => p.score), 0);

  const historyRecord = {
    id: 'pub-' + Date.now(),
    competitionId: competition.id,
    competitionTitle: competition.title,
    publishedAt,
    publishedBy: adminUser?.name || 'thinuka',
    participantCount: participants.length,
    highestScore,
    topWinnerName: topWinner.name,
    topWinnerUsername: topWinner.username,
    fileName: fileName || 'official_results.xlsx'
  };

  // Save to memory
  memoryCompetition = updatedComp;
  memoryParticipants = participants;
  memoryHistory.unshift(historyRecord);

  // Save to MongoDB if connected
  let savedToMongo = false;
  if (isConnected && db) {
    try {
      await db.collection('competitions').updateOne(
        { id: competition.id },
        { $set: updatedComp },
        { upsert: true }
      );

      await db.collection('leaderboard').deleteMany({ competitionId: competition.id });
      const docs = participants.map(p => ({
        ...p,
        competitionId: competition.id
      }));
      await db.collection('leaderboard').insertMany(docs);
      await db.collection('history').insertOne(historyRecord);
      savedToMongo = true;
    } catch (err) {
      console.warn('[MongoDB] Save error:', err.message);
    }
  }

  return res.json({
    success: true,
    record: historyRecord,
    savedToMongo,
    publishedAt
  });
});

// -------------------------------------------------------------
// Publication History
// -------------------------------------------------------------
app.get('/api/history', async (req, res) => {
  if (isConnected && db) {
    try {
      const history = await db.collection('history').find({}).sort({ publishedAt: -1 }).limit(30).toArray();
      if (history && history.length > 0) {
        return res.json({ success: true, history });
      }
    } catch (e) {
      // Ignore
    }
  }
  return res.json({ success: true, history: memoryHistory });
});

// -------------------------------------------------------------
// Health Status
// -------------------------------------------------------------
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    mongoConnected: isConnected,
    database: 'ms_codequest',
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`[Express] Backend server running at http://localhost:${PORT}`);
});
