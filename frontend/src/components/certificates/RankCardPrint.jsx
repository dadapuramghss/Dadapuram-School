import React from 'react';

export const RankCardPrint = React.forwardRef(({ student, language = 'TAMIL', rankData = {} }, ref) => {
  if (!student) return null;

  const isEnglish = language === 'ENGLISH';

  const t = {
    title: isEnglish ? 'STUDENT RANK CARD' : 'மாணவர் தரச் சான்றிதழ்',
    schoolName: isEnglish ? 'GOVERNMENT HR SEC SCHOOL DADAPURAM' : 'அரசு மேல்நிலைப் பள்ளி தாதாபுரம்',
    name: isEnglish ? 'Name' : 'பெயர்',
    classSection: isEnglish ? 'Class & Section' : 'வகுப்பு மற்றும் பிரிவு',
    emisNumber: isEnglish ? 'Roll/EMIS Number' : 'பதிவு / EMIS எண்',
    dob: isEnglish ? 'DOB' : 'பிறந்த தேதி',
    noMarks: isEnglish ? 'No marks available for this student.' : 'இந்த மாணவருக்கு மதிப்பெண்கள் இல்லை.',
    subject: isEnglish ? 'Subject' : 'பாடம்',
    total: isEnglish ? 'TOTAL' : 'மொத்தம்',
    overall: isEnglish ? 'Overall' : 'மொத்தம்',
    max: isEnglish ? 'Max' : 'அதிகபட்சம்',
    percentage: isEnglish ? '%' : 'சதவீதம்',
    grade: isEnglish ? 'Grade' : 'தரம்',
    rankSummary: isEnglish ? 'RANK SUMMARY' : 'தரவரிசை சுருக்கம்',
    classRank: isEnglish ? 'Class Rank' : 'வகுப்பு தரம்',
    schoolRank: isEnglish ? 'Overall School Rank' : 'பள்ளி தரம்',
    classTeacherSign: isEnglish ? "Teacher's Signature" : "ஆசிரியர் கையொப்பம்",
    parentSign: isEnglish ? "Parent's Signature" : "பெற்றோர் கையொப்பம்"
  };

  const translateTerm = (termName) => {
    if (isEnglish) return termName;
    const map = {
      'First Midterm': 'முதல் இடைப்பருவம்',
      'Quarterly': 'காலாண்டு',
      'Second Midterm': 'இரண்டாம் இடைப்பருவம்',
      'Half-Yearly': 'அரையாண்டு',
      'Third Midterm': 'மூன்றாம் இடைப்பருவம்',
      'Annual': 'ஆண்டு'
    };
    return map[termName] || termName;
  };

  const getGrade = (percentage) => {
    if (percentage === '-' || percentage === null || percentage === undefined || isNaN(percentage)) return '-';
    const p = parseFloat(percentage);
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    if (p >= 50) return 'D';
    return 'E';
  };

  const terms = student.terms || [];

  const standardTermOrder = [
    'First Midterm',
    'Quarterly',
    'Second Midterm',
    'Half-Yearly',
    'Third Midterm',
    'Annual'
  ];
  
  // Determine active exams: must have at least one valid mark
  const orderedTermNames = standardTermOrder.filter(termName => {
    const termObj = terms.find(t => t.termName === termName);
    if (!termObj || !termObj.marks) return false;
    return termObj.marks.some(m => m.score !== undefined && m.score !== null && m.score !== '—');
  });

  terms.forEach(termObj => {
    const termName = termObj.termName;
    if (!orderedTermNames.includes(termName)) {
      const hasMarks = termObj.marks && termObj.marks.some(m => m.score !== undefined && m.score !== null && m.score !== '—');
      if (hasMarks) {
        orderedTermNames.push(termName);
      }
    }
  });

  const allSubjectsSet = new Set();
  terms.forEach(term => {
    if (term.marks) {
      term.marks.forEach(m => {
        allSubjectsSet.add(m.subject);
      });
    }
  });
  const subjects = Array.from(allSubjectsSet);

  const termTotals = {};
  orderedTermNames.forEach(termName => termTotals[termName] = 0);
  let totalOverallObtained = 0;
  let totalOverallMax = 0;

  return (
    <div ref={ref} className={`print-certificate ${isEnglish ? 'font-sans' : 'font-serif'} hidden`}>
      <div className="w-[210mm] h-[297mm] max-h-[297mm] overflow-hidden mx-auto bg-[#FFFFFF] border border-[#8EAAC4] p-6 box-border flex flex-col text-[#142B4A]">
        
        <div className="mb-3">
          <h1 className="text-3xl font-extrabold text-center mb-1.5 tracking-wide text-[#142B4A]">{t.title}</h1>
          <h2 className="text-xl font-bold text-center mb-3 tracking-wide text-[#142B4A]">{t.schoolName}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 text-[14px] font-semibold w-full mb-4 px-2">
          <div className="flex flex-col gap-1.5">
            <p className="break-words whitespace-normal"><span className="font-bold">{t.name}:</span> {isEnglish ? student.name : (student.tamilName || student.name)}</p>
            <p><span className="font-bold">{t.classSection}:</span> {student.standard} - {student.section}</p>
          </div>
          <div className="flex flex-col gap-1.5 text-right">
            <p><span className="font-bold">{t.emisNumber}:</span> {student.emisNumber || student.admissionNumber || '-'}</p>
            <p><span className="font-bold">{t.dob}:</span> {student.dob ? student.dob.split('-').reverse().join('-') : '-'}</p>
          </div>
        </div>

        <hr className="border-t-[1.5px] border-[#142B4A] w-full mb-3" />

        <div className="mb-3 w-full max-w-lg mx-auto border-[1.5px] border-[#8EAAC4] rounded-lg shadow-sm overflow-hidden bg-white">
          <div className="bg-[#EEF5FB] text-center font-bold border-b-[1.5px] border-[#8EAAC4] py-2 text-[15px] uppercase tracking-wider text-[#142B4A]">{t.rankSummary}</div>
          <div className="grid grid-cols-2 divide-x-[1.5px] divide-[#8EAAC4] text-center">
            <div className="py-3.5">
              <div className="text-xs font-bold mb-1.5 uppercase tracking-wider text-[#142B4A]">{t.classRank}</div>
              <div className="font-extrabold text-2xl text-[#142B4A]">
                {rankData.classRank && rankData.classTotal ? `${rankData.classRank} / ${rankData.classTotal}` : '—'}
              </div>
            </div>
            <div className="py-3.5">
              <div className="text-xs font-bold mb-1.5 uppercase tracking-wider text-[#142B4A]">{t.schoolRank}</div>
              <div className="font-extrabold text-2xl text-[#142B4A]">
                {rankData.schoolRank && rankData.schoolTotal ? `${rankData.schoolRank} / ${rankData.schoolTotal}` : '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="font-extrabold text-left mb-2 uppercase tracking-wider text-[15px] text-[#142B4A]">
          SUBJECT-WISE PERFORMANCE
        </div>

        {subjects.length === 0 ? (
          <p className="text-center text-lg italic mt-10 flex-grow text-[#142B4A]">{t.noMarks}</p>
        ) : (
          <div className="w-full flex-grow">
            <table className="w-full text-center border-collapse border border-[#8EAAC4] text-[13px] font-semibold text-[#142B4A]" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-[#EEF5FB]">
                  <th className="border border-[#8EAAC4] px-2 py-3 text-left font-bold align-bottom w-[20%]">{t.subject}</th>
                  {orderedTermNames.map((termName, idx) => (
                    <th key={idx} className="border border-[#8EAAC4] p-1 font-bold align-bottom h-[85px]">
                      <div className="whitespace-nowrap flex items-center justify-center text-[12px]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        {translateTerm(termName)}
                      </div>
                    </th>
                  ))}
                  <th className="border border-[#8EAAC4] p-1.5 font-bold align-bottom min-w-[55px] text-[12.5px]">{t.overall}</th>
                  <th className="border border-[#8EAAC4] p-1.5 font-bold align-bottom min-w-[50px] text-[12.5px]">{t.max}</th>
                  <th className="border border-[#8EAAC4] p-1.5 font-bold align-bottom min-w-[60px] text-[12.5px]">{t.percentage}</th>
                  <th className="border border-[#8EAAC4] p-1.5 font-bold align-bottom min-w-[50px] text-[12.5px]">{t.grade}</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {subjects.map((subject, sIdx) => {
                  let subjectOverallObtained = 0;
                  let validTermCount = 0;

                  return (
                    <tr key={sIdx}>
                      <td className="border border-[#8EAAC4] px-2 py-1.5 text-left font-bold">{subject}</td>
                      {orderedTermNames.map((termName, tIdx) => {
                        const termObj = terms.find(t => t.termName === termName);
                        const markObj = termObj?.marks?.find(m => m.subject === subject);
                        
                        if (markObj !== undefined && markObj !== null) {
                          subjectOverallObtained += markObj.score;
                          validTermCount++;
                          termTotals[termName] += markObj.score;
                          return <td key={tIdx} className="border border-[#8EAAC4] px-1 py-1.5 font-bold">{markObj.score}</td>;
                        } else {
                          return <td key={tIdx} className="border border-[#8EAAC4] px-1 py-1.5 font-bold opacity-60">—</td>;
                        }
                      })}
                      
                      {(() => {
                        const subjectMax = validTermCount * 100;
                        totalOverallObtained += subjectOverallObtained;
                        totalOverallMax += subjectMax;
                        
                        const percentage = subjectMax > 0 ? ((subjectOverallObtained / subjectMax) * 100).toFixed(2) : '—';
                        const grade = getGrade(percentage);

                        return (
                          <>
                            <td className="border border-[#8EAAC4] px-1 py-1.5 font-extrabold">{validTermCount > 0 ? subjectOverallObtained : '—'}</td>
                            <td className="border border-[#8EAAC4] px-1 py-1.5 font-bold">{validTermCount > 0 ? subjectMax : '—'}</td>
                            <td className="border border-[#8EAAC4] px-1 py-1.5 font-extrabold">{percentage !== '—' ? `${percentage}%` : '—'}</td>
                            <td className="border border-[#8EAAC4] px-1 py-1.5 font-extrabold">{grade}</td>
                          </>
                        );
                      })()}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#EEF5FB]">
                <tr className="font-extrabold text-[#142B4A]">
                  <td className="border border-[#8EAAC4] px-2 py-2.5 text-left uppercase tracking-wide">{t.total}</td>
                  {orderedTermNames.map((termName, idx) => {
                    const hasAnyMarks = subjects.some(subj => {
                      const termObj = terms.find(t => t.termName === termName);
                      return termObj?.marks?.some(m => m.subject === subj) !== undefined;
                    });
                    
                    return <td key={idx} className="border border-[#8EAAC4] px-1 py-2.5">{hasAnyMarks ? termTotals[termName] : '—'}</td>
                  })}
                  <td className="border border-[#8EAAC4] px-1 py-2.5">{totalOverallMax > 0 ? totalOverallObtained : '—'}</td>
                  <td className="border border-[#8EAAC4] px-1 py-2.5">{totalOverallMax > 0 ? totalOverallMax : '—'}</td>
                  {(() => {
                    const totalPercentage = totalOverallMax > 0 ? ((totalOverallObtained / totalOverallMax) * 100).toFixed(2) : '—';
                    const finalGrade = getGrade(totalPercentage);
                    return (
                      <>
                        <td className="border border-[#8EAAC4] px-1 py-2.5">{totalPercentage !== '—' ? `${totalPercentage}%` : '—'}</td>
                        <td className="border border-[#8EAAC4] px-1 py-2.5">{finalGrade}</td>
                      </>
                    );
                  })()}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-[40mm] px-[15mm] pb-[8mm] font-bold">
          <div className="text-center">
            <div className="w-[55mm] mx-auto mb-[3mm] border-t border-[#142B4A]"></div>
            <div className="text-[#142B4A] text-[13px]">{t.classTeacherSign}</div>
          </div>
          <div className="text-center">
            <div className="w-[55mm] mx-auto mb-[3mm] border-t border-[#142B4A]"></div>
            <div className="text-[#142B4A] text-[13px]">{t.parentSign}</div>
          </div>
        </div>
      </div>
    </div>
  );
});
