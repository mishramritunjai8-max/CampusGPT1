"use client";

import React, { useState } from "react";
import { GraduationCap, CheckCircle } from "lucide-react";

export default function FacultyGradingPage() {
  const [students, setStudents] = useState([
    { id: 1, name: "Alice Smith", course: "CS101", grade: "A" },
    { id: 2, name: "Bob Jones", course: "CS101", grade: "B" },
    { id: 3, name: "Alice Smith", course: "CS301", grade: "Pending" }
  ]);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [gradeVal, setGradeVal] = useState("");

  const updateGrade = (id: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, grade: gradeVal.toUpperCase() } : s))
    );
    setActiveId(null);
    setGradeVal("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
          Student Grading Sheet
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review course assignments and apply grades to enrolled students.
        </p>
      </div>

      <div className="p-6 rounded-2xl glass-panel border border-border space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold">
                <th className="pb-3 pr-4">Student Name</th>
                <th className="pb-3 pr-4">Course</th>
                <th className="pb-3 pr-4 text-center">Grade</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/25">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-secondary/15 transition-all">
                  <td className="py-3.5 pr-4 font-semibold text-white">{student.name}</td>
                  <td className="py-3.5 pr-4 text-muted-foreground font-mono">{student.course}</td>
                  <td className="py-3.5 pr-4 text-center">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                      student.grade === "Pending" ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {student.grade}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {activeId === student.id ? (
                      <div className="flex gap-2 justify-end items-center">
                        <input
                          type="text"
                          value={gradeVal}
                          onChange={(e) => setGradeVal(e.target.value)}
                          placeholder="Grade"
                          className="w-16 bg-neutral-900 border border-border rounded px-1.5 py-1 text-xs text-foreground text-center"
                        />
                        <button onClick={() => updateGrade(student.id)} className="text-xs font-semibold text-emerald-400">Save</button>
                      </div>
                    ) : (
                      <button onClick={() => { setActiveId(student.id); setGradeVal(student.grade === "Pending" ? "" : student.grade); }} className="text-xs font-semibold text-purple-400 hover:text-purple-300">
                        Edit Grade
                      </button>
                    )}
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
