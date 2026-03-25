const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Data directories
const UPLOADS_DIR = path.join(__dirname, '../data/uploads');
const PROFILES_DIR = path.join(__dirname, '../data/profiles');
const REPORTS_DIR = path.join(__dirname, '../data/reports');
const TRACKER_DIR = path.join(__dirname, '../data/tracker');

[UPLOADS_DIR, PROFILES_DIR, REPORTS_DIR, TRACKER_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// File upload storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
});
const upload = multer({ storage });

// Python executable (use venv)
const getPython = () => {
    return process.platform === 'win32'
        ? path.join(__dirname, '../venv/Scripts/python')
        : path.join(__dirname, '../venv/bin/python');
};

const CLI_PATH = path.join(__dirname, '../ai_engine/cli.py');

// Generic helper: runs cli.py <action> <payload_file>, returns parsed JSON
const runPython = (action, payload) => {
    return new Promise((resolve, reject) => {
        const payloadPath = path.join(REPORTS_DIR, `payload_${Date.now()}.json`);
        fs.writeFileSync(payloadPath, JSON.stringify(payload));

        const pyProcess = spawn(getPython(), [CLI_PATH, action, payloadPath]);

        let dataStr = '';
        let errStr = '';

        pyProcess.stdout.on('data', (data) => { dataStr += data.toString(); });
        pyProcess.stderr.on('data', (data) => { errStr += data.toString(); });

        pyProcess.on('close', (code) => {
            if (fs.existsSync(payloadPath)) fs.unlinkSync(payloadPath);
            if (code !== 0) {
                console.error(`Python error (code ${code}): ${errStr}`);
                return reject(errStr || 'Unknown Python error');
            }
            try {
                // Parse last valid JSON line (handles any stray stderr-to-stdout)
                const lines = dataStr.trim().split('\n');
                let parsed = null;
                for (let i = lines.length - 1; i >= 0; i--) {
                    try { parsed = JSON.parse(lines[i]); break; } catch (_) {}
                }
                if (parsed) resolve(parsed);
                else reject('No valid JSON in Python output');
            } catch (e) {
                reject(e.toString());
            }
        });
    });
};

// ─── ROUTES ─────────────────────────────────────────────────────────────────

// Upload & parse resume
app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const result = await runPython('parse_resume', { pdf_path: req.file.path });
        // Persist profile
        fs.writeFileSync(
            path.join(PROFILES_DIR, `${req.file.filename}.json`),
            JSON.stringify(result, null, 2)
        );
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.toString() }); }
});

// Parse job description (text or URL)
app.post('/api/jd/parse', async (req, res) => {
    try {
        // Accept both { input_data, is_url } and { text_or_url }
        const payload = {
            input_data: req.body.input_data || req.body.text_or_url || '',
            is_url: req.body.is_url || false
        };
        const result = await runPython('parse_jd', payload);
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.toString() }); }
});

// Gap analysis (includes ATS scoring)
app.post('/api/analyze', async (req, res) => {
    try {
        const result = await runPython('analyze_gap', {
            candidate: req.body.candidate,
            jd: req.body.jd
        });
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.toString() }); }
});

// Rewrite resume bullets
app.post('/api/rewrite', async (req, res) => {
    try {
        const result = await runPython('rewrite_resume', {
            candidate: req.body.candidate,
            jd: req.body.jd,
            gap_analysis: req.body.gap_analysis
        });
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.toString() }); }
});

// Learning roadmap for a single skill
app.post('/api/roadmap', async (req, res) => {
    try {
        const result = await runPython('roadmap', {
            skill: req.body.skill,
            jd_context: req.body.jd_context || '',
            candidate_level: req.body.candidate_level || 'none'
        });
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.toString() }); }
});

// Interview preparation
app.post('/api/interview-prep', async (req, res) => {
    try {
        const result = await runPython('interview_prep', {
            candidate: req.body.candidate,
            jd: req.body.jd
        });
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.toString() }); }
});

// Cover letter — Server-Sent Events streaming
app.post('/api/cover-letter', (req, res) => {
    const payloadPath = path.join(REPORTS_DIR, `payload_${Date.now()}.json`);
    fs.writeFileSync(payloadPath, JSON.stringify({
        candidate: req.body.candidate,
        jd: req.body.jd,
        tone: req.body.tone || 'professional'
    }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const pyProcess = spawn(getPython(), [CLI_PATH, 'cover_letter', payloadPath]);

    pyProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim() !== '');
        for (const line of lines) {
            try {
                const chunkObj = JSON.parse(line);
                if (chunkObj.chunk) res.write(`data: ${JSON.stringify({ chunk: chunkObj.chunk })}\n\n`);
            } catch (_) { /* ignore non-JSON lines */ }
        }
    });

    pyProcess.on('close', () => {
        if (fs.existsSync(payloadPath)) fs.unlinkSync(payloadPath);
        res.write(`data: [DONE]\n\n`);
        res.end();
    });
});

// ─── APPLICATION TRACKER ────────────────────────────────────────────────────

const trackerFile = path.join(TRACKER_DIR, 'applications.json');

app.get('/api/tracker', (req, res) => {
    if (!fs.existsSync(trackerFile)) return res.json([]);
    res.json(JSON.parse(fs.readFileSync(trackerFile)));
});

app.post('/api/tracker', (req, res) => {
    let applications = [];
    if (fs.existsSync(trackerFile)) {
        applications = JSON.parse(fs.readFileSync(trackerFile));
    }
    const newApp = {
        id: Date.now(),
        ...req.body,
        status: req.body.status || 'Wishlist',
        date_added: new Date().toISOString()
    };
    applications.push(newApp);
    fs.writeFileSync(trackerFile, JSON.stringify(applications, null, 2));
    res.json(newApp);
});

app.put('/api/tracker/:id', (req, res) => {
    if (!fs.existsSync(trackerFile)) return res.status(404).json({ error: 'No tracker file' });
    let applications = JSON.parse(fs.readFileSync(trackerFile));
    const index = applications.findIndex(a => a.id == req.params.id);
    if (index > -1) {
        applications[index] = { ...applications[index], ...req.body };
        fs.writeFileSync(trackerFile, JSON.stringify(applications, null, 2));
        res.json(applications[index]);
    } else {
        res.status(404).json({ error: 'Application not found' });
    }
});

app.delete('/api/tracker/:id', (req, res) => {
    if (!fs.existsSync(trackerFile)) return res.status(404).json({ error: 'Not found' });
    let applications = JSON.parse(fs.readFileSync(trackerFile));
    applications = applications.filter(a => a.id != req.params.id);
    fs.writeFileSync(trackerFile, JSON.stringify(applications, null, 2));
    res.json({ success: true });
});

// ─── HEALTH ─────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok', groqAI: 'connected' }));

// ─── START ──────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`CareerLens APIBased backend running on port ${PORT}`));
