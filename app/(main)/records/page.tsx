"use client";

import { Suspense, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Eye,
  Download,
  Edit2,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  RefreshCw,
  FileText,
  User,
  Stethoscope,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import {
  DEFAULT_SECTION_CATALOG,
  MedicalRecord,
  RecordStatus,
  displayRecordValue,
  formatBytes,
  formatRecordDate,
  normalizeSections,
} from "@/lib/medical-records";

type RecordsResponse = {
  records?: MedicalRecord[];
  error?: string;
};

function RecordsPageContent() {
  const searchParams = useSearchParams();
  const initialSection = searchParams.get("sections");

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>(
    () => (initialSection ? [initialSection] : [])
  );
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [selectedMonth, setSelectedMonth] = useState("All Months");
  const [statusFilter, setStatusFilter] = useState<RecordStatus | "All Status">("All Status");
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [editForm, setEditForm] = useState({
    recordDate: "",
    ipNumber: "",
    patientName: "",
    doctorName: "",
    sections: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/records?limit=1000", { cache: "no-store" });
        const data = (await response.json()) as RecordsResponse;

        if (!response.ok) {
          throw new Error(data.error || "Unable to load records.");
        }

        if (!cancelled) {
          setRecords(data.records ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load records.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  const doctorsList = useMemo(
    () => uniqueSorted(records.map((record) => record.doctorName).filter(Boolean) as string[]),
    [records]
  );
  const patientsList = useMemo(
    () => uniqueSorted(records.map((record) => record.patientName).filter(Boolean) as string[]),
    [records]
  );
  const sectionsList = useMemo(
    () =>
      uniqueSorted([
        ...DEFAULT_SECTION_CATALOG.map((section) => section.name),
        ...records.flatMap((record) => record.sections),
      ]),
    [records]
  );
  const yearsList = useMemo(
    () =>
      uniqueSorted(
        records
          .map((record) => record.recordDate.slice(0, 4))
          .filter(Boolean)
      ),
    [records]
  );
  const monthsList = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .filter((record) => selectedYear === "All Years" || record.recordDate.startsWith(selectedYear))
            .map((record) => record.recordDate.slice(5, 7))
        )
      ).sort(),
    [records, selectedYear]
  );

  const filteredRecords = useMemo(() => {
    const normalizedSearch = deferredSearchQuery.trim().toLowerCase();

    return records.filter((record) => {
      const searchable = [
        record.fileName,
        record.ipNumber,
        record.patientName,
        record.doctorName,
        record.sections.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesDoctor =
        selectedDoctors.length === 0 || selectedDoctors.includes(record.doctorName ?? "");
      const matchesPatient =
        selectedPatients.length === 0 || selectedPatients.includes(record.patientName ?? "");
      const matchesSection =
        selectedSections.length === 0 ||
        record.sections.some((section) => selectedSections.includes(section));
      const matchesYear =
        selectedYear === "All Years" || record.recordDate.startsWith(selectedYear);
      const matchesMonth =
        selectedMonth === "All Months" || record.recordDate.slice(5, 7) === selectedMonth;
      const matchesStatus = statusFilter === "All Status" || record.status === statusFilter;

      return matchesSearch && matchesDoctor && matchesPatient && matchesSection && matchesYear && matchesMonth && matchesStatus;
    });
  }, [
    records,
    deferredSearchQuery,
    selectedDoctors,
    selectedPatients,
    selectedSections,
    selectedYear,
    selectedMonth,
    statusFilter,
  ]);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedDoctors.length > 0 ||
    selectedPatients.length > 0 ||
    selectedSections.length > 0 ||
    selectedYear !== "All Years" ||
    selectedMonth !== "All Months" ||
    statusFilter !== "All Status";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDoctors([]);
    setSelectedPatients([]);
    setSelectedSections([]);
    setSelectedYear("All Years");
    setSelectedMonth("All Months");
    setStatusFilter("All Status");
  };

  const openEditModal = (record: MedicalRecord) => {
    setEditingRecord(record);
    setEditError(null);
    setEditForm({
      recordDate: record.recordDate,
      ipNumber: record.ipNumber ?? "",
      patientName: record.patientName ?? "",
      doctorName: record.doctorName ?? "",
      sections: record.sections.join(", "),
    });
  };

  const saveMetadata = () => {
    if (!editingRecord) {
      return;
    }

    startSaveTransition(async () => {
      setEditError(null);

      try {
        const response = await fetch(`/api/records/${editingRecord.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recordDate: editForm.recordDate,
            ipNumber: editForm.ipNumber,
            patientName: editForm.patientName,
            doctorName: editForm.doctorName,
            sections: normalizeSections(editForm.sections),
          }),
        });
        const data = (await response.json()) as RecordsResponse & { record?: MedicalRecord };

        if (!response.ok || !data.record) {
          throw new Error(data.error || "Unable to update record metadata.");
        }

        setRecords((current) =>
          current.map((record) => (record.id === data.record?.id ? data.record : record))
        );
        setEditingRecord(null);
      } catch (error) {
        setEditError(error instanceof Error ? error.message : "Unable to update record metadata.");
      }
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Records</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Browse, search, and manage all uploaded documents securely.
          </p>
        </div>
        <div className="flex gap-2 sm:self-end">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs hover:text-destructive hover:bg-destructive/10 h-8 shrink-0"
            >
              Clear All Filters
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-8 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-border bg-card shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-3 md:p-4 border-b border-border bg-muted/20 flex flex-col gap-3 md:gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search file, IP, patient, doctor, or section..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 bg-background border-border focus-visible:ring-1 h-10"
            />
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3 w-full">
            <MultiSelectDropdown
              options={doctorsList}
              selectedValues={selectedDoctors}
              onChange={setSelectedDoctors}
              placeholder="All Doctors"
              labelPrefix="Doctors"
              className="flex-1 min-w-[130px]"
            />

            <MultiSelectDropdown
              options={patientsList}
              selectedValues={selectedPatients}
              onChange={setSelectedPatients}
              placeholder="All Patients"
              labelPrefix="Patients"
              className="flex-1 min-w-[130px]"
            />

            <MultiSelectDropdown
              options={sectionsList}
              selectedValues={selectedSections}
              onChange={setSelectedSections}
              placeholder="All Sections"
              labelPrefix="Sections"
              className="flex-1 min-w-[130px]"
            />

            <div className="relative flex-1 min-w-[120px]">
              <select
                value={selectedYear}
                onChange={(event) => {
                  const nextYear = event.target.value;
                  setSelectedYear(nextYear);
                  setSelectedMonth("All Months");
                }}
                className="w-full h-10 appearance-none bg-background border border-border text-foreground text-sm rounded-md pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="All Years">All Years</option>
                {yearsList.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </div>
            </div>

            <div className="relative flex-1 min-w-[120px]">
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full h-10 appearance-none bg-background border border-border text-foreground text-sm rounded-md pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="All Months">All Months</option>
                {monthsList.map((month) => (
                  <option key={month} value={month}>
                    {monthName(month)}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </div>
            </div>

            <div className="relative flex-1 min-w-[130px]">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as RecordStatus | "All Status")}
                className="w-full h-10 appearance-none bg-background border border-border text-foreground text-sm rounded-md pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="All Status">All Status</option>
                <option value="Synced">Synced</option>
                <option value="Uploading">Uploading</option>
                <option value="Failed">Failed</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="hidden md:block">
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
                  <TableHead className="font-medium text-foreground">Sections</TableHead>
                  <TableHead className="font-medium text-foreground">Medical Record Date</TableHead>
                  <TableHead className="font-medium text-foreground">Uploaded At</TableHead>
                  <TableHead className="font-medium text-foreground">Size</TableHead>
                  <TableHead className="font-medium text-foreground">Status</TableHead>
                  <TableHead className="text-right font-medium text-foreground pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Loading records from Supabase...
                    </TableCell>
                  </TableRow>
                ) : loadError ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-destructive">
                      {loadError}
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No medical records found matching the active filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} className="border-border hover:bg-muted/30 transition-colors group">
                      <TableCell className="text-center pl-4">
                        <Checkbox className="rounded bg-background border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                      </TableCell>
                      <TableCell className="font-medium">
                        {displayRecordValue(record.ipNumber)}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[240px] truncate">
                        {record.fileName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {displayRecordValue(record.patientName)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {displayRecordValue(record.doctorName)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.sections.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {record.sections.map((section) => (
                              <span
                                key={section}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary"
                              >
                                {section}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRecordDate(record.recordDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRecordDate(record.uploadedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {formatBytes(record.sizeBytes)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={record.status} />
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <a
                            href={`/api/records/${record.id}/view`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`View ${record.fileName}`}
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={`/api/records/${record.id}/download`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Download ${record.fileName}`}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => openEditModal(record)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Edit metadata for ${record.fileName}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading records from Supabase...
              </div>
            ) : loadError ? (
              <div className="text-center py-8 text-destructive">
                {loadError}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No medical records found matching the active filters.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{record.fileName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{displayRecordValue(record.ipNumber)}</p>
                      </div>
                      <StatusBadge status={record.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate">{displayRecordValue(record.patientName)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Stethoscope className="h-3 w-3 shrink-0" />
                        <span className="truncate">{displayRecordValue(record.doctorName)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{formatRecordDate(record.recordDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="font-mono">{formatBytes(record.sizeBytes)}</span>
                      </div>
                    </div>

                    {record.sections.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {record.sections.map((section) => (
                          <span
                            key={section}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1 pt-1 border-t border-border/50">
                      <a
                        href={`/api/records/${record.id}/view`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </a>
                      <a
                        href={`/api/records/${record.id}/download`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                      <button
                        type="button"
                        onClick={() => openEditModal(record)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border p-3 md:p-4 flex items-center justify-between bg-card text-sm">
          <p className="text-muted-foreground text-xs md:text-sm">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filteredRecords.length > 0 ? "1" : "0"}-{filteredRecords.length}
            </span>{" "}
            of <span className="font-medium text-foreground">{filteredRecords.length}</span> records
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" disabled className="h-8 w-8 rounded-lg border-border">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled className="h-8 w-8 rounded-lg border-border">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-3 md:p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border p-4 md:p-5">
              <div>
                <h2 className="text-base md:text-lg font-semibold">Edit record metadata</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Only IP number, patient, doctor, and sections are editable here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
                aria-label="Close edit modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-4 md:p-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Medical Record Date</label>
                <Input
                  type="date"
                  value={editForm.recordDate}
                  onChange={(event) => setEditForm((form) => ({ ...form, recordDate: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">IP Number</label>
                <Input
                  value={editForm.ipNumber}
                  onChange={(event) => setEditForm((form) => ({ ...form, ipNumber: event.target.value }))}
                  placeholder="e.g. IP-2026-0001"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Patient</label>
                <Input
                  value={editForm.patientName}
                  onChange={(event) => setEditForm((form) => ({ ...form, patientName: event.target.value }))}
                  placeholder="Patient name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Doctor</label>
                <Input
                  value={editForm.doctorName}
                  onChange={(event) => setEditForm((form) => ({ ...form, doctorName: event.target.value }))}
                  placeholder="Doctor name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Sections</label>
                <Input
                  value={editForm.sections}
                  onChange={(event) => setEditForm((form) => ({ ...form, sections: event.target.value }))}
                  placeholder="Cardiovascular, Neurology"
                />
                <p className="text-xs text-muted-foreground">Separate multiple sections with commas.</p>
              </div>

              {editError && <p className="text-sm text-destructive">{editError}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-border p-4 md:p-5">
              <Button variant="outline" onClick={() => setEditingRecord(null)} disabled={isSaving} className="h-9">
                Cancel
              </Button>
              <Button onClick={saveMetadata} disabled={isSaving} className="h-9">
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecordsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 h-full flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading medical records...</p>
        </div>
      }
    >
      <RecordsPageContent />
    </Suspense>
  );
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function monthName(month: string) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", timeZone: "UTC" }).format(
    new Date(`2026-${month}-01T00:00:00.000Z`)
  );
}
