import React from 'react';

export const StudyCertificatePrint = React.forwardRef(({ student }, ref) => {
  if (!student) return null;

  return (
    <div ref={ref} className="print-certificate p-10 bg-white text-black font-serif hidden">
      <h1 className="text-2xl font-bold text-center mb-8">படிப்புச் சான்றிதழ்</h1>

      <div className="space-y-4 max-w-3xl mx-auto text-lg">
        <div className="grid grid-cols-[200px_auto] gap-4">
          <div className="font-semibold">பள்ளியின் பெயர்</div>
          <div>: அரசு மேல்நிலைப் பள்ளி தாதாபுரம்-604207.</div>
        </div>

        <div className="grid grid-cols-[200px_auto] gap-4">
          <div className="font-semibold">பள்ளி எண்</div>
          <div>: 33070401302</div>
        </div>

        <div className="grid grid-cols-[200px_auto] gap-4 mt-6">
          <div className="font-semibold">மாணவரின் பெயர்</div>
          <div>: {student.tamilName || student.name}</div>
        </div>

        <div className="grid grid-cols-[200px_auto] gap-4">
          <div className="font-semibold">தந்தையின் பெயர்</div>
          <div>: {student.fatherName || '-'}</div>
        </div>

        <div className="grid grid-cols-[200px_auto] gap-4">
          <div className="font-semibold">பிறந்த தேதி</div>
          <div>: {student.dob || '-'}</div>
        </div>

        <div className="grid grid-cols-[200px_auto] gap-4">
          <div className="font-semibold">சேர்க்கை எண்</div>
          <div>: {student.admissionNumber || '-'}</div>
        </div>

        <div className="grid grid-cols-[200px_auto] gap-4 mt-6">
          <div className="font-semibold">கல்வி ஆண்டு</div>
          <div>: 2026-27</div>
        </div>

        <div className="grid grid-cols-[200px_auto] gap-4">
          <div className="font-semibold">படிப்பு / படித்த வகுப்பு</div>
          <div>: பதினொன்றாம் வகுப்பு - {student.section} பிரிவு</div>
        </div>

        <div className="grid grid-cols-[200px_auto] gap-4">
          <div className="font-semibold">மொழிப் படிப்பு</div>
          <div>: {student.medium === 'TAMIL' ? 'தமிழ்' : 'ஆங்கிலம்'}</div>
        </div>

        <div className="grid grid-cols-[200px_auto] gap-4 mt-6">
          <div className="font-semibold">மதம்</div>
          <div>: {student.religion || '-'}</div>
        </div>

        <div className="grid grid-cols-[200px_auto] gap-4">
          <div className="font-semibold">பிரிவு</div>
          <div>: {student.community || '-'}</div>
        </div>

        <div className="grid grid-cols-[200px_auto] gap-4">
          <div className="font-semibold">முகவரி</div>
          <div>: {student.address || '-'}</div>
        </div>

        <div className="mt-10 text-center font-medium leading-relaxed px-10">
          மேற்கண்ட அனைத்து விவரங்களும் பள்ளி ஆவணங்களுடன் சரிபார்க்கப்பட்டு,<br/>
          சரியானவை எனச் சான்றளிக்கப்பட்டுள்ளன.
        </div>

        <div className="flex justify-between mt-24 pt-4 px-4 font-bold">
          <div>வகுப்பு ஆசிரியர்<br/>கையொப்பம்</div>
          <div>தலைமை ஆசிரியர்</div>
        </div>
      </div>
    </div>
  );
});
