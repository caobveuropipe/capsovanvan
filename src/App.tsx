/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { DocumentArchiveView } from "./components/DocumentArchiveView";
import { CategoryConfigModal } from "./components/CategoryConfigModal";
import { IntakeModal } from "./components/IntakeModal";
import { DocumentDetailModal } from "./components/DocumentDetailModal";
import { PrintDocumentModal } from "./components/PrintDocumentModal";
import { DashboardStats } from "./components/DashboardStats";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { DocumentCategory, DocumentRecord } from "./types";
import {
  getCategories,
  saveCategories,
  getAllDocuments,
  saveDocument,
  deleteDocument,
  seedInitialDocumentsIfEmpty,
  incrementCategoryCount,
} from "./services/storage";

export default function App() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [currentTab, setCurrentTab] = useState<"archive" | "stats">("archive");

  // Modals state
  const [isIntakeOpen, setIsIntakeOpen] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<DocumentRecord | null>(null);
  const [selectedDocForPrint, setSelectedDocForPrint] = useState<DocumentRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize data on mount
  useEffect(() => {
    async function initData() {
      try {
        await seedInitialDocumentsIfEmpty();
        const loadedCats = getCategories();
        const loadedDocs = await getAllDocuments();
        setCategories(loadedCats);
        setDocuments(loadedDocs);
      } catch (e) {
        console.error("Failed to initialize database", e);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  // Category changes handler
  const handleSaveCategories = (updated: DocumentCategory[]) => {
    setCategories(updated);
    saveCategories(updated);
  };

  // New Document Created handler
  const handleDocumentCreated = async (newDoc: DocumentRecord) => {
    await saveDocument(newDoc);
    incrementCategoryCount(newDoc.categoryId);
    const updatedCats = getCategories();
    const updatedDocs = await getAllDocuments();
    setCategories(updatedCats);
    setDocuments(updatedDocs);
  };

  // Document Deleted handler
  const handleDeleteDocument = async (id: string) => {
    await deleteDocument(id);
    const updatedDocs = await getAllDocuments();
    setDocuments(updatedDocs);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenIntake={() => setIsIntakeOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        totalDocsCount={documents.length}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-24 md:pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">
              Đang tải cơ sở dữ liệu văn bản và cấu hình số hóa...
            </p>
          </div>
        ) : currentTab === "archive" ? (
          <DocumentArchiveView
            documents={documents}
            categories={categories}
            onViewDetail={(doc) => setSelectedDocForDetail(doc)}
            onPrintDocument={(doc) => setSelectedDocForPrint(doc)}
            onDeleteDocument={handleDeleteDocument}
            onOpenIntake={() => setIsIntakeOpen(true)}
          />
        ) : (
          <DashboardStats
            documents={documents}
            categories={categories}
            onViewDoc={(doc) => setSelectedDocForDetail(doc)}
            onOpenIntake={() => setIsIntakeOpen(true)}
            onOpenConfig={() => setIsConfigOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation (Floating on Mobile) */}
      <MobileBottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenIntake={() => setIsIntakeOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        totalDocsCount={documents.length}
      />

      {/* Modals */}
      {/* 1. Category Prefix/Suffix & Numbering Master Config Modal */}
      <CategoryConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        categories={categories}
        onSaveCategories={handleSaveCategories}
      />

      {/* 2. Document Intake & AI OCR Modal (Upload / Camera / Email) */}
      <IntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        categories={categories}
        onDocumentCreated={handleDocumentCreated}
        onOpenPrintModal={(doc) => {
          setIsIntakeOpen(false);
          setSelectedDocForPrint(doc);
        }}
      />

      {/* 3. Document Detail & High-Res Viewer Modal */}
      <DocumentDetailModal
        document={selectedDocForDetail}
        isOpen={!!selectedDocForDetail}
        onClose={() => setSelectedDocForDetail(null)}
        onPrint={(doc) => {
          setSelectedDocForDetail(null);
          setSelectedDocForPrint(doc);
        }}
        onDelete={handleDeleteDocument}
      />

      {/* 4. Official Printable Document Modal (Slip / Stamped Scanned Document) */}
      <PrintDocumentModal
        document={selectedDocForPrint}
        isOpen={!!selectedDocForPrint}
        onClose={() => setSelectedDocForPrint(null)}
      />
    </div>
  );
}
