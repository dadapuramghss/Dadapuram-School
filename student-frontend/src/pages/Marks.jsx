import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Award, BookOpen } from 'lucide-react';

export default function Marks() {
  const { student } = useOutletContext();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Performance</h1>
          <p className="text-gray-500 text-sm">Your examination results and progress</p>
        </div>
      </div>

      {student.terms && student.terms.length > 0 ? (
        <div className="space-y-8">
          {student.terms.map((term, index) => {
            const totalScore = term.marks.reduce((acc, curr) => acc + curr.score, 0);
            const maxScore = term.marks.length * 100;
            const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : 0;
            
            return (
              <div key={index} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="bg-indigo-50/50 px-6 py-5 border-b border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="font-bold text-indigo-900 text-xl flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
                    {term.termName} Exam
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-indigo-50">
                    <div className="text-center">
                      <span className="text-xs text-gray-500 uppercase font-semibold block">Total Marks</span>
                      <span className="text-indigo-600 font-bold">{totalScore} / {maxScore}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="text-center">
                      <span className="text-xs text-gray-500 uppercase font-semibold block">Percentage</span>
                      <span className="text-green-600 font-bold">{percentage}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {term.marks.map((mark, i) => (
                      <div key={i} className="bg-gray-50 hover:bg-white p-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-full h-1 ${mark.score >= 35 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2 truncate w-full text-center" title={mark.subject}>
                          {mark.subject}
                        </span>
                        <span className={`text-3xl font-black ${mark.score >= 35 ? 'text-gray-900' : 'text-red-500'}`}>
                          {mark.score}
                        </span>
                        {mark.score < 35 && (
                          <span className="text-[10px] text-red-500 font-bold uppercase mt-1">Needs Improvement</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Academic Records</h3>
          <p className="text-gray-500">Your examination marks have not been uploaded yet.</p>
        </div>
      )}
    </div>
  );
}
