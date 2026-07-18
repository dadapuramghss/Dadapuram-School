import React, { useState } from 'react';
import Papa from 'papaparse';
import { Database, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

export function DataSync() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      // Fetch all students.
      // Assuming getStudentsByClass returns all if standard='All' and section='All'
      const response = await api.getStudents('All', 'All');
      const students = response.data;

      if (!students || !Array.isArray(students) || students.length === 0) {
        setError('No students found to export.');
        return;
      }

      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      };

      // Map to flat structure for CSV
      const csvData = students.map(student => ({
        'Roll Number': student.rollNumber,
        'Name': student.name,
        'Standard': student.standard,
        'Section': student.section,
        'Gender': student.gender || '',
        'Medium': student.medium,
        'Tamil Name': student.tamilName || '',
        'Father Name': student.fatherName || '',
        'DOB': formatDate(student.dob),
        'Admission Number': student.admissionNumber || '',
        'Religion': student.religion || '',
        'Community': student.community || '',
        'Address': student.address || '',
        'Mobile Number': student.mobileNumber || ''
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export students. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/^\uFEFF/, ''),
      complete: async (results) => {
        try {
          const rows = results.data;
          
          // Map CSV headers to API fields using normalized keys for robustness
          const studentsToImport = rows.map(row => {
            const normRow = {};
            for (const key in row) {
              if (row.hasOwnProperty(key)) {
                // Normalize key: lowercase, remove all non-alphanumeric chars
                const normKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                // Safely convert value to string before trimming
                normRow[normKey] = row[key] != null ? String(row[key]).trim() : '';
              }
            }

            return {
              rollNumber: normRow['rollnumber'] || normRow['rollno'] || '',
              name: normRow['name'] || normRow['studentname'] || '',
              standard: normRow['standard'] || normRow['class'] || '',
              section: normRow['section'] ? String(normRow['section']).toUpperCase() : '',
              gender: normRow['gender'] || 'Other',
              medium: normRow['medium'] ? String(normRow['medium']).toUpperCase() : 'ENGLISH',
              tamilName: normRow['tamilname'] || '',
              fatherName: normRow['fathername'] || '',
              dob: normRow['dob'] || normRow['dateofbirth'] || '',
              admissionNumber: normRow['admissionnumber'] || normRow['admissionnumb'] || normRow['admissionno'] || '',
              religion: normRow['religion'] || '',
              community: normRow['community'] || '',
              address: normRow['address'] || '',
              mobileNumber: normRow['mobilenumber'] || normRow['mobile'] || ''
            };
          });

          const response = await api.post('/students/bulk', studentsToImport);
          
          if (response.success) {
            setImportResults(response.data);
          } else {
            setError('Import failed on the server.');
          }
        } catch (err) {
          console.error('Import error:', err);
          setError(err.message || 'Failed to import students. Check your CSV format.');
        } finally {
          setImporting(false);
          // Reset file input
          event.target.value = '';
        }
      },
      error: (err) => {
        setImporting(false);
        setError(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const downloadTemplate = () => {
    const templateData = [{
      'Roll Number': '101',
      'Name': 'John Doe',
      'Standard': '10',
      'Section': 'A',
      'Gender': 'Male',
      'Medium': 'ENGLISH',
      'Tamil Name': '',
      'Father Name': 'Richard Doe',
      'DOB': '2005-05-15',
      'Admission Number': 'ADM001',
      'Religion': 'Hindu',
      'Community': 'BC',
      'Address': '123 Main St, City',
      'Mobile Number': '9876543210'
    }];
    
    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="w-8 h-8 text-[#62D4CA]" />
            Data Synchronization
          </h1>
          <p className="text-[#4C677C] dark:text-[#EBD8BE]/60 text-lg">
            Bulk import and export student records using CSV files.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl border border-red-500/50 bg-red-500/10 flex items-start gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">Error</h3>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {importResults && (
        <div className="mb-8 p-6 rounded-2xl border border-green-500/30 bg-green-500/10 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <h3 className="text-lg font-bold">Import Completed Successfully</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-sm text-gray-400">New Students Added</p>
              <p className="text-3xl font-bold text-white">{importResults.added}</p>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-sm text-gray-400">Existing Students Updated</p>
              <p className="text-3xl font-bold text-white">{importResults.updated}</p>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-sm text-gray-400">Errors Encountered</p>
              <p className="text-3xl font-bold text-red-400">{importResults.errors?.length || 0}</p>
            </div>
          </div>
          
          {importResults.errors && importResults.errors.length > 0 && (
            <div className="mt-4 p-4 bg-black/30 rounded-xl border border-red-500/20 max-h-40 overflow-y-auto custom-scrollbar">
              <h4 className="text-sm font-bold text-red-400 mb-2">Error Log:</h4>
              <ul className="text-sm text-red-300/80 space-y-1 list-disc pl-4">
                {importResults.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="glass-card p-8 flex flex-col items-center text-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_50px_rgba(59,130,246,0.2)] transition-shadow">
            <Download className="w-10 h-10 text-blue-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Export Students</h2>
          <p className="text-gray-400 mb-8 max-w-sm">
            Download a complete backup of all student records in CSV format. This file can be edited and re-imported later.
          </p>
          
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="glass-button-primary bg-blue-600 hover:bg-blue-700 text-white w-full max-w-xs flex items-center justify-center gap-2 py-3 relative z-10"
          >
            {exporting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {exporting ? 'Generating CSV...' : 'Download CSV Export'}
          </button>
        </div>

        {/* Import Card */}
        <div className="glass-card p-8 flex flex-col items-center text-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#62D4CA]/5 to-[#F9CB84]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="w-20 h-20 bg-[#62D4CA]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#62D4CA]/20 shadow-[0_0_30px_rgba(98,212,202,0.1)] group-hover:shadow-[0_0_50px_rgba(98,212,202,0.2)] transition-shadow">
            <Upload className="w-10 h-10 text-[#62D4CA]" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Import Students</h2>
          <p className="text-gray-400 mb-6 max-w-sm">
            Upload a CSV file to add new students or update existing ones. Use the template format for best results.
          </p>
          
          <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
            <label className="glass-button-primary cursor-pointer w-full flex items-center justify-center gap-2 py-3 relative overflow-hidden">
              {importing ? (
                <div className="w-5 h-5 border-2 border-[#2E1C40]/30 border-t-[#2E1C40] rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
              {importing ? 'Processing...' : 'Select CSV File'}
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={importing}
              />
            </label>
            
            <button 
              onClick={downloadTemplate}
              className="text-sm text-[#4C677C] hover:text-[#EBD8BE] underline transition-colors"
            >
              Download CSV Template
            </button>
          </div>
        </div>
      </div>
      
      {/* Import Guide */}
      <div className="mt-8 glass-card p-6 md:p-8">
        <h3 className="text-xl font-bold text-white mb-4">How Import Works</h3>
        <ul className="space-y-3 text-gray-400">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold mt-0.5">1</div>
            <p><strong>Upsert Logic:</strong> If a student with the same Roll Number, Standard, and Section already exists, their information will be updated. If not, a new student will be created.</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold mt-0.5">2</div>
            <p><strong>Required Fields:</strong> Roll Number, Name, Standard, Section, and Medium are strictly required. Rows missing these will be skipped.</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold mt-0.5">3</div>
            <p><strong>Gradebook Marks:</strong> Exam marks cannot be imported via this tool. Marks must be entered via the Gradebook interface.</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
