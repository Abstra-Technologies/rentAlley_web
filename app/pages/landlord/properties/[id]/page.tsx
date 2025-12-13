// "use client";
//
// import {
//     DndContext,
//     closestCenter,
// } from "@dnd-kit/core";
// import {
//     SortableContext,
//     verticalListSortingStrategy,
// } from "@dnd-kit/sortable";
// import { Home, Plus, Sparkles, Search } from "lucide-react";
// import { Pagination } from "@mui/material";
//
// import UnitsTab from "@/components/landlord/properties/UnitsTab";
// import ErrorBoundary from "@/components/Commons/ErrorBoundary";
// import LoadingScreen from "@/components/loadingScreen";
// import AIUnitGenerator from "@/components/landlord/ai/AIUnitGenerator";
// import InviteTenantModal from "@/components/landlord/properties/InviteTenantModalPerProperty";
// import BulkImportUnitModal from "@/components/landlord/properties/BulkImportUnitModal";
//
// import { usePropertyUnitsPage } from "@/hooks/landlord/usePropertyUnitsPage";
//
// export default function ViewPropertyDetailedPage() {
//     const pageData = usePropertyUnitsPage();
//
//     if (!pageData.property_id) {
//         return <LoadingScreen message="Loading property…" />;
//     }
//
//     if (pageData.error) {
//         return <ErrorBoundary error="Failed to load units." />;
//     }
//
//     return (
//         <div className="min-h-screen bg-gray-50 px-6 pt-20">
//             {/* HEADER */}
//             <div className="mb-6 flex items-start gap-3">
//                 <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
//                     <Home className="h-6 w-6 text-blue-600" />
//                 </div>
//                 <h1 className="text-2xl font-bold text-gray-900">
//                     Unit Overview
//                 </h1>
//             </div>
//
//             {/* ACTIONS */}
//             <div className="flex gap-2 mb-4">
//                 <button onClick={pageData.handleAddUnitClick} className="btn-primary">
//                     <Plus className="h-4 w-4" /> Add Unit
//                 </button>
//                 <button onClick={() => pageData.setBulkImportModal(true)} className="btn-indigo">
//                     <Sparkles className="h-4 w-4" /> Bulk Import
//                 </button>
//             </div>
//
//             {/* SEARCH */}
//             <div className="relative max-w-md mb-6">
//                 <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
//                 <input
//                     value={pageData.searchQuery}
//                     onChange={(e) => {
//                         pageData.setSearchQuery(e.target.value);
//                         pageData.setPage(1);
//                     }}
//                     placeholder="Search units"
//                     className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
//                 />
//             </div>
//
//             {/* UNITS */}
//             <div className="bg-white rounded-lg border">
//                 <DndContext
//                     sensors={pageData.sensors}
//                     collisionDetection={closestCenter}
//                     onDragEnd={pageData.handleDragEnd}
//                 >
//                     <SortableContext
//                         items={pageData.currentUnits.map((u) => u.unit_id)}
//                         strategy={verticalListSortingStrategy}
//                     >
//                         <UnitsTab
//                             units={pageData.currentUnits}
//                             isLoading={pageData.isLoading}
//                             propertyId={pageData.property_id}
//                             handleEditUnit={pageData.handleEditUnit}
//                             handleDeleteUnit={pageData.handleDeleteUnit}
//                             handleAddUnitClick={pageData.handleAddUnitClick}
//                         />
//                     </SortableContext>
//                 </DndContext>
//
//                 {pageData.filteredUnits.length > pageData.itemsPerPage && (
//                     <div className="flex justify-center p-4 border-t">
//                         <Pagination
//                             count={Math.ceil(
//                                 pageData.filteredUnits.length / pageData.itemsPerPage
//                             )}
//                             page={pageData.page}
//                             onChange={(_, v) => pageData.setPage(v)}
//                         />
//                     </div>
//                 )}
//             </div>
//
//             {/* MODALS */}
//             {pageData.isAIGeneratorOpen && (
//                 <AIUnitGenerator propertyId={pageData.property_id} />
//             )}
//             {pageData.inviteModalOpen && (
//                 <InviteTenantModal
//                     propertyId={pageData.property_id}
//                     onClose={() => pageData.setInviteModalOpen(false)}
//                 />
//             )}
//             {pageData.bulkImportModal && (
//                 <BulkImportUnitModal
//                     isOpen
//                     propertyId={pageData.property_id}
//                     onClose={() => pageData.setBulkImportModal(false)}
//                 />
//             )}
//         </div>
//     );
// }


"use client";

import { Home, Plus, Sparkles, Search } from "lucide-react";
import { Pagination } from "@mui/material";

import UnitsTab from "@/components/landlord/properties/UnitsTab";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import LoadingScreen from "@/components/loadingScreen";
import AIUnitGenerator from "@/components/landlord/ai/AIUnitGenerator";
import InviteTenantModal from "@/components/landlord/properties/InviteTenantModalPerProperty";
import BulkImportUnitModal from "@/components/landlord/properties/BulkImportUnitModal";

import { usePropertyUnitsPage } from "@/hooks/landlord/usePropertyUnitsPage";

export default function ViewUnitsPage() {
    const page = usePropertyUnitsPage();

    /* ---------------- DEBUG: CONSOLE ---------------- */
    console.log("[ViewUnitsPage DEBUG]", {
        property_id: page.property_id,
        isLoading: page.isLoading,
        error: page.error,
        unitsCount: page.currentUnits?.length,
        filteredUnitsCount: page.filteredUnits?.length,
        page: page.page,
    });

    /* ---------------- GUARDS (DEBUG VISIBLE) ---------------- */

    if (!page.property_id) {
        return (
            <div className="p-6 text-red-600 text-sm">
                DEBUG: property_id is missing
            </div>
        );
    }

    if (page.error) {
        return (
            <div className="p-6 text-red-600 text-sm">
                DEBUG ERROR:
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded">
          {JSON.stringify(page.error, null, 2)}
        </pre>
            </div>
        );
    }

    /* ---------------- RENDER ---------------- */

    return (
        <div className="min-h-screen bg-gray-50 px-6 pt-20 pb-24">
            {/* HEADER */}
            <header className="mb-6 flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                    <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Units</h1>
                    <p className="text-sm text-gray-600">
                        View and manage all units under this property
                    </p>
                </div>
            </header>

            {/* ACTIONS */}
            <section className="flex flex-wrap gap-2 mb-6">
                <button onClick={page.handleAddUnitClick} className="btn-primary">
                    <Plus className="h-4 w-4" />
                    Add Unit
                </button>

                <button
                    onClick={() => page.setBulkImportModal(true)}
                    className="btn-indigo"
                >
                    <Sparkles className="h-4 w-4" />
                    Bulk Import
                </button>

                <button
                    onClick={() => page.setIsAIGeneratorOpen(true)}
                    className="btn-emerald"
                >
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                </button>

                <button
                    onClick={() => page.setInviteModalOpen(true)}
                    className="btn-purple"
                >
                    Invite Tenant
                </button>
            </section>

            {/* SEARCH */}
            <section className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                    value={page.searchQuery}
                    onChange={(e) => {
                        page.setSearchQuery(e.target.value);
                        page.setPage(1);
                    }}
                    placeholder="Search units"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                />
            </section>

            {/* UNITS LIST */}
            <section className="bg-white rounded-lg border">
                {/* EMPTY STATE DEBUG */}
                {!page.isLoading && page.currentUnits.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                        DEBUG: No units found for this property
                    </div>
                )}

                <UnitsTab
                    units={page.currentUnits}
                    isLoading={page.isLoading}
                    propertyId={page.property_id}
                    handleEditUnit={page.handleEditUnit}
                    handleDeleteUnit={page.handleDeleteUnit}
                    handleAddUnitClick={page.handleAddUnitClick}
                />

                {page.filteredUnits.length > page.itemsPerPage && (
                    <div className="flex justify-center p-4 border-t">
                        <Pagination
                            count={Math.ceil(
                                page.filteredUnits.length / page.itemsPerPage
                            )}
                            page={page.page}
                            onChange={(_, v) => page.setPage(v)}
                        />
                    </div>
                )}
            </section>

            {/* RAW DATA DEBUG (TEMP) */}
            <pre className="mt-6 p-4 text-xs bg-gray-900 text-green-400 rounded overflow-auto max-h-64">
        {JSON.stringify(
            {
                property_id: page.property_id,
                currentUnits: page.currentUnits,
                filteredUnits: page.filteredUnits,
            },
            null,
            2
        )}
      </pre>

            {/* MODALS */}
            {page.isAIGeneratorOpen && (
                <AIUnitGenerator propertyId={page.property_id} />
            )}

            {page.inviteModalOpen && (
                <InviteTenantModal
                    propertyId={page.property_id}
                    onClose={() => page.setInviteModalOpen(false)}
                />
            )}

            {page.bulkImportModal && (
                <BulkImportUnitModal
                    isOpen
                    propertyId={page.property_id}
                    onClose={() => page.setBulkImportModal(false)}
                />
            )}

            {/* RENDER CONFIRMATION */}
            <div className="fixed bottom-2 right-2 text-xs bg-black text-white px-2 py-1 rounded">
                DEBUG: ViewUnitsPage rendered
            </div>
        </div>
    );
}
