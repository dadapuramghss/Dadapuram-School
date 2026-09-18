import React from 'react';

export const RankCardPrint = React.forwardRef(({ student, language = 'TAMIL' }, ref) => {
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
    examSuffix: isEnglish ? 'Examination' : 'தேர்வு',
    subject: isEnglish ? 'Subject' : 'பாடம்',
    marksObtained: isEnglish ? 'Marks Obtained' : 'பெற்ற மதிப்பெண்கள்',
    total: isEnglish ? 'Total' : 'மொத்தம்',
    classTeacherSign: isEnglish ? <>Class Teacher<br/>Signature</> : <>வகுப்பு ஆசிரியர்<br/>கையொப்பம்</>,
    hmSign: isEnglish ? <>Headmaster<br/>Signature</> : <>தலைமை ஆசிரியர்<br/>கையொப்பம்</>
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

  // Aggregate marks for display
  const terms = student.terms || [];
  let totalScore = 0;

  return (
    <div ref={ref} className={`print-certificate ${isEnglish ? 'font-sans' : 'font-serif'} hidden`}>
      <div className="w-[210mm] min-h-[297mm] mx-auto bg-white border border-gray-300 p-10 box-border flex flex-col text-black">
        {/* Header Alignment */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center mb-2 uppercase">{t.title}</h1>
          <h2 className="text-xl font-bold text-center mb-2 uppercase">{t.schoolName}</h2>
        </div>

        {/* Student Information - Two Column Grid */}
        <div className="grid grid-cols-2 gap-4 text-lg w-full mb-4">
          <div className="flex flex-col gap-1">
            <p className="break-words whitespace-normal"><span className="font-semibold">{t.name}:</span> {isEnglish ? student.name : (student.tamilName || student.name)}</p>
            <p><span className="font-semibold">{t.classSection}:</span> {student.standard} - {student.section}</p>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <p><span className="font-semibold">{t.emisNumber}:</span> {student.emisNumber || student.admissionNumber || '-'}</p>
            <p><span className="font-semibold">{t.dob}:</span> {student.dob ? student.dob.split('-').reverse().join('-') : '-'}</p>
          </div>
        </div>

        {/* Horizontal Divider */}
        <hr className="border-t-2 border-black w-full mb-6" />

        {/* Examination Sections */}
        {terms.length === 0 ? (
          <p className="text-center text-lg italic mt-10 flex-grow">{t.noMarks}</p>
        ) : (
          <div className="space-y-8 flex-grow">
            {terms.map((term, i) => {
              const termTotal = term.marks.reduce((acc, curr) => acc + curr.score, 0);
              totalScore += termTotal;
              return (
                <div key={i} className="w-full">
                  <h3 className="text-lg font-bold mb-3 uppercase text-left">{translateTerm(term.termName)} {t.examSuffix}</h3>
                  <table className="w-full text-left border-collapse border border-black" style={{ tableLayout: 'fixed' }}>
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-2 w-[70%] text-left font-bold">{t.subject}</th>
                        <th className="border border-black p-2 w-[30%] text-center font-bold">{t.marksObtained}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {term.marks.map((m, idx) => (
                        <tr key={idx}>
                          <td className="border border-black p-2 text-left font-medium">{m.subject}</td>
                          <td className="border border-black p-2 text-center">{m.score}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border border-black p-2 text-right">{t.total}</td>
                        <td className="border border-black p-2 text-center">{termTotal}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* Signatures */}
        <div className="mt-16 flex justify-between items-end px-8 font-bold text-lg pt-10">
          <div className="text-center">
            {t.classTeacherSign}
          </div>
          <div className="text-center">
            {t.hmSign}
          </div>
        </div>
      </div>
    </div>
  );
});
