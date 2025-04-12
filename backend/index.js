// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Import the connection pool from db.js

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Test the connection pool on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL database.');
    conn.release();
  } catch (err) {
    console.error('Error connecting to MySQL database:', err);
  }
})();

// GET all tasks
app.get('/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks ORDER BY due_date ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST a new task
app.post('/tasks', async (req, res) => {
  const { task_name, description, due_date, priority } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO tasks (task_name, description, due_date, priority, status) VALUES (?, ?, ?, ?, ?)',
      [task_name, description, due_date, priority, 'undone']
    );
    const [newTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(newTask[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// DELETE a task
app.delete('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// PUT update a task
app.put('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  const { task_name, description, due_date, priority, status } = req.body;
  try {
    await pool.query(
      'UPDATE tasks SET task_name = ?, description = ?, due_date = ?, priority = ?, status = ? WHERE id = ?',
      [task_name, description, due_date, priority, status, taskId]
    );
    const [updatedTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    res.json(updatedTask[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.listen(port, () => {
  console.log(`Todo app listening at http://localhost:${port}`);
});