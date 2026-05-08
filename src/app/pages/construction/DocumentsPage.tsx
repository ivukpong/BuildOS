import { useState, useEffect, useRef } from "react";
import { getProjectDocuments } from "../../api/construction-extras";
import {
  Upload,
  Search,
  FolderOpen,
  Folder,
  FileText,
  Download,
  Eye,
  MoreHorizontal,
  Trash2,
  Edit,
  Plus,
  ChevronRight,
} from "lucide-react";

interface DocFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  date: string;
  version: string;
  project: string;
}

interface DocFolder {
  id: string;
  project: string;
  count: number;
  lastModified: string;
}

const typeIcon: Record<string, string> = {
  PDF: "📄",
  XLSX: "📊",
  ZIP: "🗜️",
  DWG: "📐",
};
const typeColor: Record<string, string> = {
  PDF: "bg-red-50 text-red-700",
  XLSX: "bg-green-50 text-green-700",
  ZIP: "bg-gray-100 text-gray-700",
  DWG: "bg-blue-50 text-blue-700",
};

export function DocumentsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<"folders" | "all">("folders");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [docList, setDocList] = useState<DocFile[]>([]);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const folders: DocFolder[] = Array.from(
    new Set(docList.map((d) => d.project)),
  ).map((project) => ({
    id: project,
    project,
    count: docList.filter((d) => d.project === project).length,
    lastModified:
      docList
        .filter((d) => d.project === project)
        .sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? "—",
  }));

  useEffect(() => {
    getProjectDocuments()
      .then((data) =>
        setDocList(
          data.map((d) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            size: d.size ? `${(d.size / (1024 * 1024)).toFixed(1)} MB` : "—",
            uploadedBy: d.uploadedBy ?? "—",
            date: d.createdAt ? d.createdAt.split("T")[0] : "—",
            version: "v1.0",
            project: d.folderName ?? d.projectId ?? "General",
          })),
        ),
      )
      .catch(() => {});
  }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocList((prev) => [
      ...prev,
      {
        id: `d${Date.now()}`,
        name: file.name,
        type: file.name.split(".").pop()?.toUpperCase() ?? "FILE",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedBy: "You",
        date: new Date().toISOString().split("T")[0],
        version: "v1.0",
        project: selectedProject ?? "General",
      },
    ]);
    showToast(`"${file.name}" uploaded successfully`);
    e.target.value = "";
  }

  function confirmRename(id: string) {
    if (!renameName.trim()) return;
    setDocList((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: renameName.trim() } : d)),
    );
    setRenameId(null);
    setRenameName("");
  }

  function handleDelete(id: string) {
    setDocList((prev) => prev.filter((d) => d.id !== id));
    setDeleteId(null);
  }

  const displayed = docList.filter((d) => {
    if (selectedProject && d.project !== selectedProject) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const deleteDoc = docList.find((d) => d.id === deleteId);

  return (
    <div className="space-y-5">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toastMsg}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Central file system for all project documents
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Files", value: docList.length },
          { label: "Total Size", value: "316 MB" },
          { label: "Projects", value: folders.length },
          { label: "Uploaded This Week", value: "4" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-lg p-4 text-center"
          >
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* View toggle + search */}
      <div className="flex items-center gap-4">
        <div className="flex border border-gray-200 rounded-md overflow-hidden">
          <button
            onClick={() => {
              setView("folders");
              setSelectedProject(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${view === "folders" ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <Folder className="w-3.5 h-3.5" /> Folders
          </button>
          <button
            onClick={() => setView("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border-l border-gray-200 ${view === "all" ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <FileText className="w-3.5 h-3.5" /> All Files
          </button>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
          />
        </div>
      </div>

      {/* Folder view */}
      {view === "folders" && !selectedProject && (
        <div className="grid grid-cols-3 gap-4">
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setView("all");
                setSelectedProject(f.project);
              }}
              className="bg-white border border-gray-200 rounded-lg p-5 text-left hover:border-orange-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <FolderOpen className="w-8 h-8 text-orange-400 group-hover:text-orange-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {f.project}
                  </p>
                  <p className="text-xs text-gray-400">{f.count} files</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500" />
              </div>
              <p className="text-xs text-gray-400">
                Last modified: {f.lastModified}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* File list */}
      {(view === "all" || selectedProject) && (
        <div>
          {selectedProject && (
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => {
                  setView("folders");
                  setSelectedProject(null);
                }}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Folders
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {selectedProject}
              </span>
            </div>
          )}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Version
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Uploaded By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">
                          {typeIcon[d.type] ?? "📁"}
                        </span>
                        {renameId === d.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              confirmRename(d.id);
                            }}
                            className="flex items-center gap-1"
                          >
                            <input
                              autoFocus
                              value={renameName}
                              onChange={(e) => setRenameName(e.target.value)}
                              className="border border-orange-400 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 w-48"
                            />
                            <button
                              type="submit"
                              className="text-xs text-orange-600 font-medium hover:text-orange-700 px-1"
                            >
                              OK
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenameId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600 px-1"
                            >
                              ×
                            </button>
                          </form>
                        ) : (
                          <span className="font-medium text-gray-900">
                            {d.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-mono font-medium ${typeColor[d.type] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {d.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {d.size}
                    </td>
                    <td className="px-4 py-3 text-xs text-blue-600 font-medium">
                      {d.version}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[160px]">
                      {d.project}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {d.uploadedBy}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {d.date}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => showToast(`Previewing "${d.name}"…`)}
                          className="p-1 rounded hover:bg-gray-200 text-gray-400"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => showToast(`Downloading "${d.name}"…`)}
                          className="p-1 rounded hover:bg-gray-200 text-gray-400"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenu(openMenu === d.id ? null : d.id)
                            }
                            className="p-1 rounded hover:bg-gray-200 text-gray-400"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {openMenu === d.id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1"
                              onMouseLeave={() => setOpenMenu(null)}
                            >
                              <button
                                onClick={() => {
                                  setRenameId(d.id);
                                  setRenameName(d.name);
                                  setOpenMenu(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="w-3.5 h-3.5" /> Rename
                              </button>
                              <hr className="my-1 border-gray-100" />
                              <button
                                onClick={() => {
                                  setDeleteId(d.id);
                                  setOpenMenu(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayed.length === 0 && (
              <div className="py-12 text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No documents found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && deleteDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Delete Document
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-gray-700">
                    "{deleteDoc.name}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
