// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---- Config ----
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const SALT_ROUNDS = 10;
const PORT = process.env.PORT || 4000;

// ---- Connect MongoDB ----
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });

// ---- Schemas / Models ----
const { Schema } = mongoose;

const ProgressSchema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  lessonsCompleted: { type: Number, default: 0 },
  lessonsTotal: { type: Number, default: 0 },
  xpEarned: { type: Number, default: 0 },
  badges: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],
});

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, index: true, required: true },
  passwordHash: { type: String, required: true },
  educationLevel: { type: String, enum: ['12th', 'undergraduate', 'postgraduate', 'other'], default: 'undergraduate' },
  subscription: { type: String, enum: ['free','basic','premium'], default: 'free' },
  xp: { type: Number, default: 0 },
  badges: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],
  enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  progress: [ProgressSchema],
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const LessonSchema = new Schema({
  title: String,
  content: String, // could be text or markup or an S3 URL for resource
  type: { type: String, enum: ['listening','reading','video','quiz','text'], default: 'text' },
  durationMinutes: Number,
  order: Number,
  resources: [String], // URLs or resource identifiers
});
const Lesson = mongoose.model('Lesson', LessonSchema);

const CourseSchema = new Schema({
  title: String,
  description: String,
  level: { type: String, enum: ['12th','undergraduate','postgraduate','all'], default: 'all' },
  category: String,
  lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
  createdAt: { type: Date, default: Date.now },
});
const Course = mongoose.model('Course', CourseSchema);

const BadgeSchema = new Schema({
  name: String,
  description: String,
  xpThreshold: Number
});
const Badge = mongoose.model('Badge', BadgeSchema);

const PracticeSubmissionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  lesson: { type: Schema.Types.ObjectId, ref: 'Lesson' },
  answers: Schema.Types.Mixed,
  score: Number,
  xpEarned: Number,
  createdAt: { type: Date, default: Date.now },
});
const PracticeSubmission = mongoose.model('PracticeSubmission', PracticeSubmissionSchema);

// ---- Simple utility functions ----
async function awardXpToUser(userId, xpAmount) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  user.xp += xpAmount;
  await user.save();
  await checkForBadges(user);
  return user;
}

async function checkForBadges(user) {
  // Award badges if xp crosses thresholds (simple example)
  // Badge documents should be created ahead of time via admin endpoint or seed
  const badges = await Badge.find().sort({ xpThreshold: 1 });
  let any = false;
  for (const badge of badges) {
    const has = user.badges.some(b => b.toString() === badge._id.toString());
    if (!has && user.xp >= badge.xpThreshold) {
      user.badges.push(badge._id);
      any = true;
    }
  }
  if (any) await user.save();
}

// ---- Auth middleware ----
function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = payload.id;
    next();
  });
}

// ---- Multer for uploads (audio) ----
const upload = multer({ dest: 'uploads/' });

// ---- Routes ----

// --- Auth: register / login ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, educationLevel } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({ name, email, passwordHash, educationLevel });
    await user.save();
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, xp: user.xp } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, xp: user.xp } });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await User.findById(req.userId).populate('badges').populate('progress.course');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    xp: user.xp,
    badges: user.badges,
    subscription: user.subscription,
    educationLevel: user.educationLevel,
    enrolledCourses: user.enrolledCourses,
    progress: user.progress,
  });
});

// --- Path / education level selection ---
app.post('/api/path/select', authenticateToken, async (req, res) => {
  const { educationLevel } = req.body;
  if (!educationLevel) return res.status(400).json({ error: 'educationLevel required' });
  const user = await User.findById(req.userId);
  user.educationLevel = educationLevel;
  await user.save();
  res.json({ ok: true, educationLevel });
});

// --- Subscription ---
app.post('/api/subscription', authenticateToken, async (req, res) => {
  const { subscription } = req.body; // 'free'|'basic'|'premium'
  if (!['free','basic','premium'].includes(subscription)) return res.status(400).json({ error: 'invalid subscription' });
  const user = await User.findById(req.userId);
  user.subscription = subscription;
  await user.save();
  res.json({ ok: true, subscription });
});

// --- Courses ---
app.get('/api/courses', authenticateToken, async (req, res) => {
  // Return courses tailored to user's level first
  const user = await User.findById(req.userId);
  const preferred = await Course.find({ $or: [{ level: user.educationLevel }, { level: 'all' }] }).populate('lessons').lean();
  const others = await Course.find({ level: { $nin: [user.educationLevel, 'all'] } }).populate('lessons').lean();
  res.json({ preferred, others });
});

app.get('/api/courses/:id', authenticateToken, async (req, res) => {
  const course = await Course.findById(req.params.id).populate('lessons');
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

app.post('/api/courses/:id/enroll', authenticateToken, async (req, res) => {
  const course = await Course.findById(req.params.id).populate('lessons');
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const user = await User.findById(req.userId);
  if (!user.enrolledCourses.some(c => c.toString() === course._id.toString())) {
    user.enrolledCourses.push(course._id);
    // initialize progress
    user.progress.push({
      course: course._id,
      lessonsCompleted: 0,
      lessonsTotal: (course.lessons || []).length,
      xpEarned: 0
    });
    await user.save();
  }
  res.json({ ok: true, enrolledCourses: user.enrolledCourses });
});

// --- Lessons ---
app.get('/api/lessons/:id', authenticateToken, async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
  res.json(lesson);
});

// Replace your /api/lessons/:id/complete with this robust handler
app.post('/api/lessons/:id/complete', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.params.id;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // find the course that contains this lesson
    const course = await Course.findOne({ lessons: lessonId });
    if (!course) return res.status(404).json({ error: 'Course for lesson not found' });

    // check enrollment
    const isEnrolled = user.enrolledCourses.some(c => c.toString() === course._id.toString());
    if (!isEnrolled) {
      // optionally auto-enroll or return error -- here we return error but show guidance
      return res.status(400).json({ error: 'User not enrolled in this course' });
    }

    // find or create progress entry for this course
    let progress = user.progress.find(p => p.course && p.course.toString() === course._id.toString());
    if (!progress) {
      // create a new progress object
      progress = {
        course: course._id,
        lessonsCompleted: 0,
        lessonsTotal: (course.lessons || []).length,
        xpEarned: 0,
        completedLessons: [] // we'll store completed lesson ids to avoid duplicates
      };
      user.progress.push(progress);
      // refresh reference to the inserted progress
      progress = user.progress.find(p => p.course && p.course.toString() === course._id.toString());
    }

    // Ensure completedLessons array exists (we add this field to the schema if not already present)
    if (!progress.completedLessons) progress.completedLessons = [];

    // idempotency: if lesson already completed, return current progress without giving XP again
    if (progress.completedLessons.map(id => id.toString()).includes(lessonId.toString())) {
      await user.save();
      return res.json({ ok: true, message: 'Lesson already completed', progress, totalXp: user.xp });
    }

    // award XP per lesson
    const XP_PER_LESSON = 20;
    progress.completedLessons.push(lessonId);
    progress.lessonsCompleted = Math.min(progress.lessonsTotal, progress.lessonsCompleted + 1);
    progress.xpEarned += XP_PER_LESSON;

    user.xp += XP_PER_LESSON;

    await user.save();
    await checkForBadges(user);

    return res.json({ ok: true, xpAwarded: XP_PER_LESSON, totalXp: user.xp, progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});


// --- Practice submissions (listening/reading) ---
// Accept file uploads (audio) optionally and answers in JSON
app.post('/api/practice/:lessonId/submit', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { answers } = req.body; // expect JSON string or object
    const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers || {};
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    // Very simple auto-scoring:
    // - If there are textual answers: each non-empty answer counts
    // - If audio file present: small bonus
    let score = 0;
    if (parsedAnswers && typeof parsedAnswers === 'object') {
      const answerCount = Object.values(parsedAnswers).filter(a => a && a.toString().trim() !== '').length;
      score += answerCount * 10; // 10 points per answer
    }
    if (req.file) {
      score += 10; // small bonus for audio presence
    }
    if (score > 100) score = 100;

    // XP reward: proportional to score and lesson duration
    const baseXP = Math.round((score / 100) * 50); // up to 50 xp per practice
    const xpEarned = baseXP;

    const submission = new PracticeSubmission({
      user: req.userId,
      lesson: lessonId,
      answers: parsedAnswers,
      score,
      xpEarned
    });
    await submission.save();

    // award xp to user and link to progress
    const user = await User.findById(req.userId);
    user.xp += xpEarned;

    // also increment the course progress xp for the relevant course if enrolled
    // find course that contains this lesson
    const course = await Course.findOne({ lessons: lessonId });
    if (course) {
      const prog = user.progress.find(p => p.course && p.course.toString() === course._id.toString());
      if (prog) {
        prog.xpEarned += xpEarned;
      } else {
        // If not enrolled, do not auto enroll; but optionally record minimal progress
      }
    }

    await user.save();
    await checkForBadges(user);

    res.json({ ok: true, score, xpEarned, totalXp: user.xp, submissionId: submission._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// --- Dashboard & Recommendations ---
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  const user = await User.findById(req.userId).populate('badges').populate('enrolledCourses').populate('progress.course');
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Simple recommendations: courses of the same category as enrolled ones or matching level
  const enrolledCatIds = user.enrolledCourses.map(c => c._id);
  let recs = [];
  if (user.enrolledCourses.length > 0) {
    // pick categories from enrolled
    const categories = user.enrolledCourses.map(c => c.category).filter(Boolean);
    recs = await Course.find({ category: { $in: categories }, _id: { $nin: enrolledCatIds } }).limit(6);
  } else {
    recs = await Course.find({ level: { $in: [user.educationLevel, 'all'] } }).limit(6);
  }

  // badges, xp, progress, personalized courses
  res.json({
    user: { id: user._id, name: user.name, xp: user.xp, badges: user.badges, subscription: user.subscription },
    enrolledCourses: user.enrolledCourses,
    progress: user.progress,
    recommendations: recs
  });
});

app.get('/api/recommendations', authenticateToken, async (req, res) => {
  const user = await User.findById(req.userId);
  const recs = await Course.find({ $or: [{ level: user.educationLevel }, { level: 'all' }] }).limit(8);
  res.json(recs);
});

// --- Similar courses endpoint ---
app.get('/api/courses/:id/similar', authenticateToken, async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  // simplicity: find other courses same category or level
  const similar = await Course.find({
    _id: { $ne: course._id },
    $or: [{ category: course.category }, { level: course.level }]
  }).limit(6);
  res.json(similar);
});

// --- Badges list ---
app.get('/api/badges', authenticateToken, async (req, res) => {
  const badges = await Badge.find().sort({ xpThreshold: 1 });
  res.json(badges);
});

// --- Admin / bootstrap helpers (create courses/lessons/badges) ---
// For simplicity these are unprotected in this single-file example,
// in production require admin auth or env key.
app.post('/api/admin/lesson', async (req, res) => {
  const { title, content, type, durationMinutes, order } = req.body;
  const lesson = new Lesson({ title, content, type, durationMinutes, order });
  await lesson.save();
  res.json(lesson);
});

app.post('/api/admin/course', async (req, res) => {
  const { title, description, level, category, lessonIds } = req.body;
  const course = new Course({ title, description, level, category, lessons: lessonIds || [] });
  await course.save();
  res.json(course);
});

app.post('/api/admin/badge', async (req, res) => {
  const { name, description, xpThreshold } = req.body;
  const badge = new Badge({ name, description, xpThreshold });
  await badge.save();
  res.json(badge);
});

app.put('/api/admin/course/:id/lessons', async (req, res) => {
  try {
    const courseId = req.params.id;
    let { lessonIds } = req.body;

    // normalize input: accept single string or array
    if (!lessonIds) return res.status(400).json({ error: 'lessonIds required (array or single id)' });
    if (!Array.isArray(lessonIds)) lessonIds = [lessonIds];

    // Validate IDs format quickly (optional): filter out falsy values
    lessonIds = lessonIds.map(id => id && id.toString()).filter(Boolean);
    if (lessonIds.length === 0) return res.status(400).json({ error: 'No valid lessonIds provided' });

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Validate lesson ids actually exist in Lesson collection
    const validLessons = await Lesson.find({ _id: { $in: lessonIds } }).select('_id').lean();
    const validIds = validLessons.map(l => l._id.toString());
    if (validIds.length === 0) {
      return res.status(400).json({ error: 'None of the provided lessonIds are valid' });
    }

    // Merge without duplicates (keep existing order, append new valid ones)
    const existingIds = (course.lessons || []).map(id => id.toString());
    const merged = [...existingIds];
    for (const id of validIds) {
      if (!existingIds.includes(id)) merged.push(id);
    }

    course.lessons = merged;
    await course.save();

    // return updated course with lessons populated (optional)
    const updatedCourse = await Course.findById(courseId).populate('lessons');

    res.json({ ok: true, course: updatedCourse });
  } catch (err) {
    console.error('Error appending lessons to course', err);
    res.status(500).json({ error: 'server error' });
  }
});

// --- Misc: Get user progress for a course ---
app.get('/api/courses/:id/progress', authenticateToken, async (req, res) => {
  const user = await User.findById(req.userId).populate('progress.course');
  const progress = user.progress.find(p => p.course && p.course._id.toString() === req.params.id);
  res.json(progress || { lessonsCompleted: 0, lessonsTotal: 0, xpEarned: 0 });
});

// --- A simple health route ---
app.get('/api/health', (req, res) => res.json({ ok: true, now: new Date() }));

// ---- Error handling & start ----
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
