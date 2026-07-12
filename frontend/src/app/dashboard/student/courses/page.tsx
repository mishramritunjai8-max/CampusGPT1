"use client";

import React from "react";
import { BookOpen, FileText, CheckCircle, Clock } from "lucide-react";

export default function StudentCoursesPage() {
  const courses = [
    { code: "CS101", name: "Introduction to Computer Science", grade: "A", instructor: "Prof. Alan Turing", credits: 4, status: "Completed" },
    { code: "CS301", name: "Artificial Intelligence & Neural Networks", grade: "Ongoing", instructor: "Prof. Alan Turing", credits: 4, status: "Active" },
    { code: "MATH201", name: "Calculus II", grade: "B+", instructor: "Prof. Ada Lovelace", credits: 4, status: "Active" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
          My Academic Coursework
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your enrolled classes, grading states, and credits progression.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course, idx) => (
          <div key={idx} className="p-6 rounded-2xl glass-panel border border-border flex flex-col justify-between h-48 space-y-4">
            <div className="flex justify-between items-start">
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                {course.code}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                course.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"
              }`}>
                {course.status}
              </span>
            </div>
            
            <div>
              <h3 className="text-base font-bold text-white leading-snug">{course.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{course.instructor}</p>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border/30 text-xs">
              <span className="text-muted-foreground font-mono">{course.credits} Credits</span>
              <span className="font-bold text-purple-400 font-mono">Grade: {course.grade}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
