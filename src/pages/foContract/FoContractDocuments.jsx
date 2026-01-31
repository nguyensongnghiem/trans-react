import { useEffect, useState } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

/* ================= ENV ================= */
const API_BASE = import.meta.env.VITE_BE_API_URL;

/* ================= MAIN ================= */
export default function FoContractDocuments({ contractId }) {
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

    console.log("🔍 FoContractDocuments: contractId changed to:", contractId);

    // 🟢 RESET STATE NGAY LẬP TỨC KHI ID THAY ĐỔI
    setPdfList([]);
    setSelectedPdf(null);
    setSearchPdf("");
    setLoading(true);
    setError(null);

    const controller = new AbortController();

    const apiUrl = `/contract/${contractId}/pdfs`;
    console.log("📡 Fetching PDFs from:", apiUrl);

    axios
      .get(apiUrl, { signal: controller.signal })
      .then((res) => {
        const list = res.data || [];
        console.log(`✅ Received ${list.length} PDFs for contract ${contractId}:`, list);
        setPdfList(list);
        // Tự động chọn file đầu tiên nếu có
        if (list.length > 0) {
          setSelectedPdf(list[0]);
        }
      })
      .catch((err) => {
        if (err.name !== "Canceled") {
          console.error("❌ Error fetching PDFs for contract", contractId, ":", err);
          setPdfList([]);
          setError("Không tải được danh sách PDF");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      console.log("🧹 Cleanup: Aborting request for contract", contractId);
      controller.abort();
    };
  }, [contractId]); // Removed axios from dependencies

  /* ================= FILTER ================= */
  const filteredPdfList = pdfList.filter((file) =>
    file.toLowerCase().includes(searchPdf.toLowerCase()),
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
        `/contract/${contractId}/pdf/${encodeURIComponent(fileToDelete)}`,
      );

      setPdfList((prev) => prev.filter((f) => f !== fileToDelete));

      if (selectedPdf === fileToDelete) {
        setSelectedPdf(null);
      }
    } catch (err) {
      console.error(err);
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
              className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-auto px-1">
            {loading && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                Đang tải...
              </div>
            )}

            {error && (
              <div className="px-3 py-4 text-sm text-red-500 text-center">
                {error}
              </div>
            )}

            {!loading && !error && filteredPdfList.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                {pdfList.length === 0
                  ? "Chưa có văn bản nào"
                  : "Không tìm thấy file"}
              </div>
            )}

            {filteredPdfList.map((file) => (
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
        <div className="flex-1 flex flex-col bg-gray-100">
          {!selectedPdf ? (
            <div className="flex flex-1 items-center justify-center text-gray-400">
              {pdfList.length > 0 ? "Chọn file PDF để xem" : "Không có dữ liệu"}
            </div>
          ) : (
            <>
              <div className="border-b px-4 py-2 text-sm font-semibold text-gray-700 bg-white shadow-sm flex justify-between items-center">
                <span className="truncate"> 📄 {selectedPdf}</span>
              </div>

              <iframe
                src={`${API_BASE}/contract/${contractId}/pdf/${encodeURIComponent(
                  selectedPdf,
                )}`}
                className="flex-1 w-full border-none"
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
      className={`mx-1 my-1 flex items-center justify-between rounded px-3 py-2 text-sm cursor-pointer transition-colors duration-200
        ${
          selected
            ? "bg-blue-100 text-blue-900 font-medium border border-blue-200"
            : "text-gray-700 hover:bg-gray-200"
        }
      `}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="flex-shrink-0">📄</span>
        <span className="truncate" title={file}>
          {file}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Xoá file"
        className="ml-2 rounded-full p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function DeleteConfirmModal({ file, deleting, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[400px] rounded-lg bg-white shadow-xl transform transition-all">
        <div className="relative border-b px-4 py-3 font-semibold text-gray-800 flex justify-between items-center">
          Xác nhận xoá
          <button
            onClick={onCancel}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 text-sm text-gray-600">
          Bạn có chắc chắn muốn xoá file:
          <div className="mt-2 font-bold text-gray-800 break-all bg-gray-50 p-2 rounded border border-gray-200">
            {file}
          </div>
          <p className="mt-2 text-xs text-red-500">
            Hành động này không thể hoàn tác.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t px-4 py-3 bg-gray-50 rounded-b-lg">
          <button
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            disabled={deleting}
          >
            Huỷ bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className={`rounded px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors
              ${
                deleting
                  ? "bg-red-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }
            `}
          >
            {deleting ? "Đang xoá..." : "Xoá file"}
          </button>
        </div>
      </div>
    </div>
  );
}
