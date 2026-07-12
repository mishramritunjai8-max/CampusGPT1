"use client";

import React, { useState } from "react";
import { Users, Shield } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([
    { id: "demo-admin-id", name: "Dr. Sarah Jenkins", email: "admin@campusgpt.edu", role: "admin", department: "IT Services" },
    { id: "demo-faculty-1-id", name: "Prof. Alan Turing", email: "faculty1@campusgpt.edu", role: "faculty", department: "Computer Science" },
    { id: "demo-faculty-2-id", name: "Prof. Ada Lovelace", email: "faculty2@campusgpt.edu", role: "faculty", department: "Mathematics" },
    { id: "demo-student-1-id", name: "Alice Smith", email: "student1@campusgpt.edu", role: "student", department: "Computer Science" }
  ]);

  const handleRoleToggle = (id: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
          Manage Platform Access
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Promote or demote user permissions and security roles.
        </p>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-border space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Department</th>
                <th className="pb-3 text-right">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/25">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/15 transition-all">
                  <td className="py-3.5 pr-4 font-semibold text-white">{u.name}</td>
                  <td className="py-3.5 pr-4 text-muted-foreground font-mono">{u.email}</td>
                  <td className="py-3.5 pr-4 text-muted-foreground">{u.department}</td>
                  <td className="py-3.5 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleToggle(u.id, e.target.value)}
                      className="bg-neutral-900 border border-border text-foreground text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
