import React, { useEffect, useState } from "react";

// ---------------- STATIC SAMPLE DATA ---------------- //
const sampleNotifications = [
  {
    id: "n1",
    title: "New Task Assigned",
    body: "You have been assigned to the 'UI Redesign' task.",
    date: "2025-01-03",
  },
  {
    id: "n2",
    title: "Workflow Updated",
    body: "The 'Development Pipeline' workflow was updated.",
    date: "2025-01-05",
  },
  {
    id: "n3",
    title: "Project Deadline Extended",
    body: "The deadline for 'Mobile App' has been moved to Feb 20.",
    date: "2025-01-07",
  },
];

export default function Notifications() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load static data only
  useEffect(() => {
    setLoading(true);

    setTimeout(() => {
      setNotes(sampleNotifications);
      setLoading(false);
    }, 400); // Slight delay for realistic loading feel
  }, []);

  if (loading) return <div className="p-4">Loading notifications...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>

      {notes.length === 0 ? (
        <div>No notifications.</div>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="font-semibold text-gray-800">{n.title}</div>
              <div className="text-sm text-gray-600 mt-1">{n.body}</div>
              <div className="text-xs text-gray-400 mt-2">{n.date}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
