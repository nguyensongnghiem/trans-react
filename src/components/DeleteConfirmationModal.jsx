import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  IconButton,
} from "@material-tailwind/react";
import { TrashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import CustomButton from "./CustomButton"; // Assuming CustomButton is a common component

function DeleteConfirmationModal({
  open,
  handler, // Function to toggle the modal's open state
  onConfirm, // Function to execute when delete is confirmed
  itemName, // The name of the item being deleted (e.g., "router R_HNI_001")
  title = "Xác nhận xóa",
  message = "Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.",
  confirmText = "Xác nhận xóa",
  cancelText = "Hủy bỏ",
  deleting = false, // State to indicate if deletion is in progress
}) {
  return (
    <Dialog
      open={open}
      handler={handler}
      size="xs"
      className="rounded-lg overflow-hidden shadow-xl"
    >
      <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-3">
        <div className="bg-red-100 p-2 rounded-full">
          <TrashIcon className="h-5 w-5 text-red-600" />
        </div>
        <Typography variant="h5" color="red" className="font-semibold">
          {title}
        </Typography>
        <IconButton
          size="sm"
          variant="text"
          className="!absolute right-3.5 top-3.5 text-gray-500 hover:bg-gray-200 rounded-full"
          onClick={handler}
        >
          <XMarkIcon className="h-5 w-5" />
        </IconButton>
      </div>

      <DialogBody className="p-6 text-blue-gray-700">
        <Typography
          variant="paragraph"
          color="blue-gray"
          className="font-medium"
        >
          {message.replace("mục này", itemName ? `"${itemName}"` : "mục này")}
        </Typography>
        <Typography variant="small" color="gray" className="mt-3 italic">
          Hành động này không thể phục hồi và dữ liệu sẽ bị xóa vĩnh viễn khỏi
          hệ thống.
        </Typography>
      </DialogBody>

      <DialogFooter className="bg-gray-50/50 px-4 py-3 gap-2 border-t border-gray-200">
        <CustomButton
          variant="text"
          color="blue-gray"
          onClick={handler}
          size="sm"
          disabled={deleting}
        >
          {cancelText}
        </CustomButton>
        <CustomButton
          variant="filled"
          color="red"
          onClick={onConfirm}
          size="sm"
          className="flex items-center gap-2 shadow-md shadow-red-500/20"
          disabled={deleting}
        >
          {deleting ? (
            <>
              <TrashIcon className="h-4 w-4 animate-pulse" />
              <span>Đang xóa...</span>
            </>
          ) : (
            <>
              <TrashIcon className="h-4 w-4" />
              <span>{confirmText}</span>
            </>
          )}
        </CustomButton>
      </DialogFooter>
    </Dialog>
  );
}

export default DeleteConfirmationModal;
