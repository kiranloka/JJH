"use client";

import { useState, useMemo } from "react";

import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Download, 
  Trash, 
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, StatusType } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { DEMO_RECORD_DOWNLOAD_URL, DEMO_RECORD_VIEW_URL } from "@/lib/demo-record";

const mockRecords = [
  { id: "IP-2024-0892", patientName: "Rahul Sharma", doctor: "Dr. A. Gupta", filename: "Patient_History_0892.pdf", date: "May 23, 2026", size: "2.4 MB", status: "Synced" as StatusType },
  { id: "IP-2024-0893", patientName: "Priya Patel", doctor: "Dr. S. Mehta", filename: "Lab_Results_Blood_0893.pdf", date: "May 23, 2026", size: "1.8 MB", status: "Uploading" as StatusType },
  { id: "IP-2024-0894", patientName: "Amit Kumar", doctor: "Dr. R. Desai", filename: "Discharge_Summary_0894.pdf", date: "May 22, 2026", size: "4.1 MB", status: "Synced" as StatusType },
  { id: "IP-2024-0895", patientName: "Sneha Reddy", doctor: "Dr. A. Gupta", filename: "Consultation_Notes_0895.pdf", date: "May 22, 2026", size: "1.2 MB", status: "Synced" as StatusType },
  { id: "IP-2024-0896", patientName: "Vikram Singh", doctor: "Dr. M. Ali", filename: "MRI_Report_0896.pdf", date: "May 21, 2026", size: "8.4 MB", status: "Failed" as StatusType },
  { id: "IP-2024-0897", patientName: "Anjali Joshi", doctor: "Dr. S. Mehta", filename: "Patient_History_0897.pdf", date: "May 20, 2026", size: "3.2 MB", status: "Synced" as StatusType },
  { id: "IP-2024-0898", patientName: "Karan Malhotra", doctor: "Dr. R. Desai", filename: "Surgery_Consent_0898.pdf", date: "May 19, 2026", size: "1.5 MB", status: "Synced" as StatusType },
  { id: "IP-2024-0899", patientName: "Pooja Verma", doctor: "Dr. A. Gupta", filename: "ECG_Results_0899.pdf", date: "May 19, 2026", size: "5.6 MB", status: "Synced" as StatusType },
  { id: "IP-2024-0900", patientName: "Rahul Sharma", doctor: "Dr. A. Gupta", filename: "Prescription_Refill_0900.pdf", date: "May 18, 2026", size: "0.8 MB", status: "Synced" as StatusType },
  { id: "IP-2024-0901", patientName: "Neha Kapoor", doctor: "Dr. M. Ali", filename: "Admission_Forms_0901.pdf", date: "May 18, 2026", size: "4.3 MB", status: "Synced" as StatusType },
];
export default function RecordsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("All Doctors");
  const [selectedPatient, setSelectedPatient] = useState("All Patients");

  const doctors = useMemo(() => ["All Doctors", ...Array.from(new Set(mockRecords.map(r => r.doctor)))], []);
  const patients = useMemo(() => ["All Patients", ...Array.from(new Set(mockRecords.map(r => r.patientName)))], []);

  const filteredRecords = useMemo(() => {
    return mockRecords.filter(record => {
      const matchesSearch = record.filename.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            record.doctor.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDoctor = selectedDoctor === "All Doctors" || record.doctor === selectedDoctor;
      const matchesPatient = selectedPatient === "All Patients" || record.patientName === selectedPatient;

      return matchesSearch && matchesDoctor && matchesPatient;
    });
  }, [searchQuery, selectedDoctor, selectedPatient]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Records</h1>
        <p className="text-muted-foreground mt-1">Browse, search, and manage all uploaded documents securely.</p>
      </div>

      <Card className="rounded-2xl border-border bg-card shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Filters and Search Header */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col xl:flex-row gap-4 justify-between items-center">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search file, IP, patient, or doctor..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-background border-border focus-visible:ring-1 h-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
            <div className="relative flex-1 min-w-[140px] xl:w-40">
              <select 
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full h-10 appearance-none bg-background border border-border text-foreground text-sm rounded-md pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {doctors.map(doc => <option key={doc} value={doc}>{doc}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </div>
            </div>

            <div className="relative flex-1 min-w-[140px] xl:w-40">
              <select 
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full h-10 appearance-none bg-background border border-border text-foreground text-sm rounded-md pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {patients.map(pat => <option key={pat} value={pat}>{pat}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </div>
            </div>

            <div className="relative flex-1 min-w-[140px] xl:w-40">
              <select className="w-full h-10 appearance-none bg-background border border-border text-foreground text-sm rounded-md pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-ring">
                <option>All Time</option>
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative flex-1 min-w-[140px] xl:w-40">
              <select className="w-full h-10 appearance-none bg-background border border-border text-foreground text-sm rounded-md pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-ring">
                <option>All Status</option>
                <option>Synced</option>
                <option>Uploading</option>
                <option>Failed</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="border-border">
                <TableHead className="w-12 text-center pl-4">
                  <Checkbox className="rounded bg-background border-input" />
                </TableHead>
                <TableHead className="font-medium text-foreground">IP Number</TableHead>
                <TableHead className="font-medium text-foreground">File Name</TableHead>
                <TableHead className="font-medium text-foreground">Patient</TableHead>
                <TableHead className="font-medium text-foreground">Doctor</TableHead>
                <TableHead className="font-medium text-foreground">Upload Date</TableHead>
                <TableHead className="font-medium text-foreground">Size</TableHead>
                <TableHead className="font-medium text-foreground">Status</TableHead>
                <TableHead className="text-right font-medium text-foreground pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id} className="border-border hover:bg-muted/30 transition-colors group">
                  <TableCell className="text-center pl-4">
                    <Checkbox className="rounded bg-background border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  </TableCell>
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell className="text-muted-foreground">{record.filename}</TableCell>
                  <TableCell className="text-muted-foreground">{record.patientName}</TableCell>
                  <TableCell className="text-muted-foreground">{record.doctor}</TableCell>
                  <TableCell className="text-muted-foreground">{record.date}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{record.size}</TableCell>
                  <TableCell>
                    <StatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <a
                        href={DEMO_RECORD_VIEW_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`View ${record.filename}`}
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={DEMO_RECORD_DOWNLOAD_URL}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Download ${record.filename}`}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl border-border bg-popover shadow-md">
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit2 className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Footer */}
        <div className="border-t border-border p-4 flex items-center justify-between bg-card text-sm">
          <p className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredRecords.length > 0 ? "1" : "0"}-{Math.min(10, filteredRecords.length)}</span> of <span className="font-medium text-foreground">{filteredRecords.length}</span> records
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" disabled className="h-8 w-8 rounded-lg border-border">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
