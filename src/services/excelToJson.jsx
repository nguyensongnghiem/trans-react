import React, { useState } from "react";
import * as XLSX from "xlsx";
export default function excelToJson() {
  const [jsonData, setJsonData] = useState([]);
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      // Đọc dữ liệu từ file
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Lấy dữ liệu từ sheet đầu tiên
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Chuyển đổi dữ liệu sang JSON
      const json = XLSX.utils.sheet_to_json(worksheet);

      // Cập nhật state
      setJsonData(json);
      console.log(json); // Hiển thị JSON trong console
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <h2>Dữ liệu JSON:</h2>
      <pre>{JSON.stringify(jsonData, null, 2)}</pre>
    </div>
  );
}
