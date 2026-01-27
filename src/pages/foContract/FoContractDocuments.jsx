import { useEffect, useState } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";


/* ================= ENV ================= */
const API_BASE = import.meta.env.VITE_BE_API_URL;

/* ================= MAIN ================= */
export default function FoContractDocuments({ contractId, onClose }) {
  const axios = useAxiosPrivate();

  const [pdfList, setPdfList] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [searchPdf, setSearchPdf] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ================= FETCH PDF ================= */
  useEffect(() => {
    if (!contractId) return;

    setLoading(true);
    setError(null);

    axios
      .get(`/contract/${contractId}/pdfs`)
    axios.get(`/contract/${contractId}/pdfs`)
      .then(res => {
        setPdfList(res.data || []);
        setPdfList(res.data || [])
      })
      .catch(() => {
        setPdfList([]);
        setError("Không tải được danh sách PDF");

      })
      .finally(() => setLoading(false));
  }, [contractId]);

  /* ================= AUTO SELECT ================= */
  useEffect(() => {
    if (pdfList.length > 0 && !selectedPdf) {
      setSelectedPdf(pdfList[0]);
    }
  }, [pdfList]);

  /* ================= FILTER ================= */
  const filteredPdfList = pdfList.filter(file =>
    file.toLowerCase().includes(searchPdf.toLowerCase())
  );

  /* ================= DELETE ================= */
  const openDeleteModal = (file) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      setDeleting(true);

      await axios.delete(
        `/contract/${contractId}/pdf/${encodeURIComponent(fileToDelete)}`
      );

      setPdfList(prev => prev.filter(f => f !== fileToDelete));

      if (selectedPdf === fileToDelete) {
        setSelectedPdf(null);
      }
    } catch {
      alert("Xoá file thất bại");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  /* ================= RENDER ================= */
  return (
    <div className="flex h-full flex-col bg-white">

      <div className="flex flex-1 overflow-hidden">

        {/* ===== SIDEBAR ===== */}
        <div className="w-1/3 border-r bg-gray-50 flex flex-col">

          {/* SEARCH */}
          <div className="p-2">
            <input
              type="text"
              placeholder=" Tìm file PDF..."
              value={searchPdf}
              onChange={(e) => setSearchPdf(e.target.value)}
              className="w-full rounded border px-2 py-1 text-sm"
            />
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-auto px-1">

            {loading && (
              <div className="px-3 py-4 text-sm text-gray-400">
                Đang tải danh sách PDF...
              </div>
            )}

            {error && (
              <div className="px-3 py-4 text-sm text-red-500">
                {error}
              </div>
            )}

            {!loading && filteredPdfList.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400">
                Không có file PDF
              </div>
            )}

            {filteredPdfList.map(file => (
              <PdfListItem
                key={file}
                file={file}
                selected={selectedPdf === file}
                onSelect={() => setSelectedPdf(file)}
                onDelete={() => openDeleteModal(file)}
              />
            ))}
          </div>
        </div>

        {/* ===== VIEWER ===== */}
        <div className="flex-1 flex flex-col">
          {!selectedPdf ? (
            <div className="flex flex-1 items-center justify-center text-gray-400">
              Chọn file PDF để xem
            </div>
          ) : (
            <>
              <div className="border-b px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50">
                📄 {selectedPdf}
              </div>

              <iframe
                src={`${API_BASE}/contract/${contractId}/pdf/${encodeURIComponent(selectedPdf)}`}
                className="flex-1 w-full"
                title="pdf-viewer"
              />
            </>
          )}
        </div>
      </div>

      {/* ===== DELETE MODAL ===== */}
      {showDeleteModal && (
        <DeleteConfirmModal
          file={fileToDelete}
          deleting={deleting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

/* ================= COMPONENTS ================= */

function PdfListItem({ file, selected, onSelect, onDelete }) {
  return (
    <div
      onClick={onSelect}
      className={`mx-1 my-1 flex items-center justify-between rounded px-2 py-2 text-sm cursor-pointer
        ${selected
          ? "bg-blue-100 border border-blue-300"
          : "hover:bg-gray-200"}
      `}
    >
      <div className="flex items-center gap-2">
        📄
        <span className="break-words">{file}</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Xoá file"
        className="ml-2 rounded-full p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 transition"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function DeleteConfirmModal({ file, deleting, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[400px] rounded bg-white shadow-lg">

        <div className="relative border-b px-4 py-3 font-semibold text-gray-700">
          Xác nhận xoá
          <button
            onClick={onCancel}
            className="absolute right-3 top-3 rounded-full p-1 text-gray-500 hover:bg-gray-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 text-sm text-gray-600">
          Bạn có chắc chắn muốn xoá file:
          <div className="mt-2 font-semibold break-words">
            {file}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button
            onClick={onCancel}
            className="rounded px-3 py-1 text-sm hover:bg-gray-100"
            disabled={deleting}
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className={`rounded px-3 py-1 text-sm text-white
              ${deleting
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"}
            `}
          >
            {deleting ? "Đang xoá..." : "Xoá"}
          </button>
        </div>
      </div>
    </div>
  );
}
