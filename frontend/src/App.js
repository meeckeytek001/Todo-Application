import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./App.css";

// Define the base URL once here
const BASE_URL = "http://localhost:4000";

export default function TodoApp() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    name: "",
    desc: "",
    date: "",
    priority: "medium",
  });

  // Fetch tasks when the component mounts
  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch(`${BASE_URL}/tasks`);
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }
        let tasksData = await response.json();
        // Sort tasks so that the task with the highest ID (newest) is first.
        tasksData.sort((a, b) => b.id - a.id);
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    }
    fetchTasks();
  }, []);

  // Helper function to format the date for the database (YYYY-MM-DD)
  const formatForDatabase = (dateStr) => {
    // If the date is falsy, return null; otherwise take the first 10 characters.
    return dateStr ? dateStr.substr(0, 10) : null;
  };

  const handleAdd = async () => {
    if (!newTask.name.trim()) return;

    try {
      // Prepare the payload with a properly formatted date
      const payload = {
        task_name: newTask.name,
        description: newTask.desc,
        due_date: formatForDatabase(newTask.date),
        priority: newTask.priority,
      };

      // Send a POST request to add the new task
      const response = await fetch(`${BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      // Get the saved task from the backend
      const savedTask = await response.json();
      // Prepend the new task so it appears at the top of the list
      setTasks([savedTask, ...tasks]);
    } catch (error) {
      console.error("Error adding task:", error);
    }

    // Reset the form fields
    setNewTask({ name: "", desc: "", date: "", priority: "medium" });
  };

  const handleDelete = async (id) => {
    try {
      // Send a DELETE request to the backend
      const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete task from the database");
      }
      // Update local state only if deletion was successful
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Updated markCompleted function: updates both UI and backend
  const markCompleted = async (id) => {
    // Find the task that needs updating
    const taskToUpdate = tasks.find((task) => task.id === id);
    if (!taskToUpdate) return;

    // Prepare payload with updated status and same date format adjustment if needed.
    const payload = {
      task_name: taskToUpdate.task_name || taskToUpdate.name,
      description: taskToUpdate.description || taskToUpdate.desc,
      due_date: formatForDatabase(taskToUpdate.due_date || taskToUpdate.date),
      priority: taskToUpdate.priority,
      status: "Completed",
    };

    try {
      const response = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to update task in the database");
      }
      // Update local state with updated task data
      const updatedTask = await response.json();
      setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)));
    } catch (error) {
      console.error("Error marking task as completed:", error);
    }
  };

  // Helper function to format dates for display in the UI
  const formatDueDate = (dateString) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper function to display status nicely in the UI
  const displayStatus = (status) => {
    if (!status || status === "undone") return "Not Completed";
    return status;
  };

  return (
    <div className="container">
      <h1 className="title">Todo Application</h1>

      <div className="task-form">
        <input
          type="text"
          placeholder="Task Name"
          value={newTask.name}
          onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          value={newTask.desc}
          onChange={(e) => setNewTask({ ...newTask, desc: e.target.value })}
        />
        <input
          type="date"
          value={newTask.date}
          onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
        />
        <select
          value={newTask.priority}
          onChange={(e) =>
            setNewTask({ ...newTask, priority: e.target.value })
          }
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <motion.button
          className="btn add-btn"
          onClick={handleAdd}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          Add Task
        </motion.button>
      </div>

      <div className="task-list">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              className="task-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
              layout
            >
              <div className="task-info">
                <h3>{task.task_name || task.name}</h3>
                <p>{task.description || task.desc}</p>
                <p>
                  Due: {formatDueDate(task.due_date || task.date)} | Priority:{" "}
                  {task.priority}
                </p>
                <p>Status: {displayStatus(task.status)}</p>
              </div>
              <div className="task-actions">
                <motion.button
                  className="btn delete-btn"
                  onClick={() => handleDelete(task.id)}
                  whileTap={{ scale: 0.95 }}
                >
                  Delete
                </motion.button>
                {displayStatus(task.status) !== "Completed" && (
                  <motion.button
                    className="btn complete-btn"
                    onClick={() => markCompleted(task.id)}
                    whileTap={{ scale: 0.95 }}
                  >
                    Mark as Completed
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
