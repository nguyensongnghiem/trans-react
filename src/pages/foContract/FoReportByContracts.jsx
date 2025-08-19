import React, { useState, useMemo } from "react";
import useContracts from "../../hooks/useContracts";
import {
  Card,
  CardBody,
  Typography,
  Select,
  Option,
  Button,
} from "@material-tailwind/react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const FoReportByContracts = () => {
  const { contracts } = useContracts();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");

  const formatVND = (value) => {
    if (typeof value !== "number" || isNaN(value)) {
      return "0 ₫";
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Tính toán báo cáo theo hợp đồng
  const reportData = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return [];
    }

    const costsByContract = {};

    contracts.forEach((contract) => {
      const contractNumber = contract.contractNumber || "Không xác định";
      const supplierName = contract.transmissionOwner?.name || "Không xác định";
      const signedDate = new Date(contract.signedDate);
      const endDate = new Date(contract.endDate);

      // Bỏ qua hợp đồng kết thúc trước năm chọn
      if (endDate.getFullYear() < selectedYear) {
        return;
      }

      if (!costsByContract[contractNumber]) {
        costsByContract[contractNumber] = {
          contractId: contractNumber,
          supplierName: supplierName,
          monthlyCosts: Array(12).fill(0),
          totalYearlyCost: 0,
        };
      }

      if (Array.isArray(contract.hiredFoLineList)) {
        contract.hiredFoLineList.forEach((fo) => {
          if (fo.cost > 0 && fo.finalDistance > 0) {
            const monthlyCost = Math.round(fo.cost * fo.finalDistance);
            const signedYear = signedDate.getFullYear();
            const signedMonth = signedDate.getMonth(); // 0-based

            if (selectedYear > signedYear) {
              for (let i = 0; i < 12; i++) {
                costsByContract[contractNumber].monthlyCosts[i] += monthlyCost;
              }
            } else if (selectedYear === signedYear) {
              for (let i = signedMonth; i < 12; i++) {
                costsByContract[contractNumber].monthlyCosts[i] += monthlyCost;
              }
            }
            costsByContract[contractNumber].totalDistance = Math.round((costsByContract[contractNumber].totalDistance || 0) + fo.finalDistance);
            costsByContract[contractNumber].totalFo = (costsByContract[contractNumber].totalFo || 0) + 1;
          }
        });
      }
    });

    const finalReportData = Object.values(costsByContract)
      .map((data) => {
        const total = data.monthlyCosts.reduce((sum, cost) => sum + cost, 0);
        return {
          ...data,
          totalYearlyCost: total,
        };
      })
      .filter((item) => item.totalYearlyCost > 0)
      .sort((a, b) => a.contractId.localeCompare(b.contractId));

    return finalReportData;
  }, [contracts, selectedYear]);

  const filteredReportData = useMemo(() => {
    let filteredData = reportData;
    if (selectedSupplier !== "all") {
      filteredData = filteredData.filter(
        (row) => row.supplierName === selectedSupplier
      );
    }
    return filteredData;
  }, [reportData, selectedSupplier]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2019;
    return Array.from(
      { length: currentYear - startYear + 1 },
      (_, i) => startYear + i
    ).reverse();
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);

  const suppliers = useMemo(() => {
    const supplierList = new Set();
    contracts.forEach((contract) => {
      if (contract.transmissionOwner?.name) {
        supplierList.add(contract.transmissionOwner.name);
      }
    });
    return ["Tất cả", ...Array.from(supplierList).sort()];
  }, [contracts]);

  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    filteredReportData.forEach((row) => {
      row.monthlyCosts.forEach((cost, index) => {
        totals[index] += cost;
      });
    });
    return totals;
  }, [filteredReportData]);

  const totalYearlyCost = useMemo(() => {
    return filteredReportData.reduce(
      (sum, row) => sum + row.totalYearlyCost,
      0
    );
  }, [filteredReportData]);

  // Xuất Excel thay vì CSV
  const handleExport = () => {
    if (filteredReportData.length === 0) {
      alert("Không có dữ liệu để xuất.");
      return;
    }

    let dataToExport;
    let fileNameMonth;

    if (selectedMonth === "all") {
      const headers = [
        "Mã Hợp đồng",
        "Nhà Cung cấp",
        ...months.map((m) => `Tháng ${m}`),
        "Tổng Năm",
      ];
      dataToExport = filteredReportData.map((row) => {
        return {
          "Mã Hợp đồng": row.contractId,
          "Nhà Cung cấp": row.supplierName,
          ...months.reduce((acc, month, index) => {
            acc[`Tháng ${month}`] = row.monthlyCosts[index];
            return acc;
          }, {}),
          "Tổng Năm": row.totalYearlyCost,
        };
      });

      const totalRow = {
        "Mã Hợp đồng": "Tổng cộng",
        "Nhà Cung cấp": "",
        ...months.reduce((acc, month, index) => {
          acc[`Tháng ${month}`] = monthlyTotals[index];
          return acc;
        }, {}),
        "Tổng Năm": totalYearlyCost,
      };
      dataToExport.push(totalRow);

      fileNameMonth = "TatCaCacThang";

      const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
        header: headers,
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `BaoCaoNam${selectedYear}`);
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(dataBlob, `BaoCaoChiPhiFO_HopDong_${fileNameMonth}_${selectedYear}.xlsx`);
    } else {
      dataToExport = filteredReportData.map((row) => {
        const monthlyCost = row.monthlyCosts[selectedMonth - 1];
        return {
          "Mã Hợp đồng": row.contractId,
          "Nhà Cung cấp": row.supplierName,
          "Chi phí tháng": monthlyCost,
          "Tổng năm": row.totalYearlyCost,
        };
      });

      const totalRow = {
        "Mã Hợp đồng": "Tổng cộng",
        "Nhà Cung cấp": "",
        "Chi phí tháng": monthlyTotals[selectedMonth - 1],
        "Tổng năm": totalYearlyCost,
      };
      dataToExport.push(totalRow);

      fileNameMonth = `Thang${selectedMonth}`;

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `BaoCaoThang${selectedMonth}`);
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(dataBlob, `BaoCaoChiPhiFO_HopDong_${fileNameMonth}_${selectedYear}.xlsx`);
    }
  };

  return (
    <div className="p-5">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <Typography variant="h5" color="blue-gray" className="text-center md:text-left">
              Báo cáo chi phí thuê kênh FO theo hợp đồng năm {selectedYear}
            </Typography>
            <Button
              variant="filled"
              color="green"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleExport}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5
                  A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12
                  12 16.5m0 0-4.5-4.5M12 16.5V3"
                />
              </svg>
              Xuất Excel
            </Button>
          </div>

          {/* Bộ lọc */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="w-48">
              <Select
                label="Chọn năm"
                value={String(selectedYear)}
                onChange={(val) => setSelectedYear(Number(val))}
              >
                {years.map((year) => (
                  <Option key={year} value={String(year)}>{year}</Option>
                ))}
              </Select>
            </div>
            <div className="w-48">
              <Select
                label="Chọn tháng"
                value={String(selectedMonth)}
                onChange={(val) =>
                  setSelectedMonth(val === "all" ? "all" : Number(val))
                }
              >
                <Option value="all">Tất cả các tháng</Option>
                {months.map((month) => (
                  <Option key={month} value={String(month)}>
                    Tháng {month}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="w-48">
              <Select
                label="Chọn nhà cung cấp"
                value={selectedSupplier}
                onChange={(val) => setSelectedSupplier(val)}
              >
                {suppliers.map((supplier, index) => (
                  <Option
                    key={index}
                    value={supplier === "Tất cả" ? "all" : supplier}
                  >
                    {supplier}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Wrapper cho phép cuộn độc lập */}
          <div className="h-[60vh] overflow-y-auto">
            <div className="min-w-full table-container">
              <table className="w-full text-left border-collapse border border-slate-400">
                <thead className="bg-white shadow sticky top-0 z-10">
                  <tr>
                    <th className="p-2 border border-slate-300">STT</th>
                    <th className="p-2 border border-slate-300">Mã Hợp đồng</th>
                    <th className="p-2 border border-slate-300">Nhà Cung cấp</th>
                    <th className="p-2 border border-slate-300">Số tuyến</th>
                    <th className="p-2 border border-slate-300">Số km</th>
                    {selectedMonth === "all" ? (
                      months.map((m) => (
                        <th key={m} className="p-2 border border-slate-300 text-center">
                          Tháng {m}
                        </th>
                      ))
                    ) : (
                      <th className="p-2 border border-slate-300 text-center">
                        Tháng {selectedMonth}
                      </th>
                    )}
                    <th className="p-2 border border-slate-300 text-center">Tổng Năm</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReportData.length > 0 ? (
                    <>
                      {filteredReportData.map((row, index) => (
                        <tr key={index} className="even:bg-blue-gray-50/50">
                          <td className="p-2 border border-slate-300">{index + 1}</td>
                          <td className="p-2 border border-slate-300">{row.contractId}</td>
                          <td className="p-2 border border-slate-300">{row.supplierName}</td>
                          <td className="p-2 border border-slate-300">{row.totalFo}</td>
                          <td className="p-2 border border-slate-300">{row.totalDistance}</td>  
                          {selectedMonth === "all" ? (
                            row.monthlyCosts.map((cost, i) => (
                              <td key={i} className="p-2 border border-slate-300 text-center">{formatVND(cost)}</td>
                            ))
                          ) : (
                            <td className="p-2 border border-slate-300 text-center">
                              {formatVND(row.monthlyCosts[selectedMonth - 1])}
                            </td>
                          )}
                          <td className="p-2 border border-slate-300 text-center font-semibold text-blue-600">
                            {formatVND(row.totalYearlyCost)}
                          </td>
                        </tr>
                      ))}
                      {/* Tổng cộng */}
                      <tr className="border-t border-blue-gray-200">
                        <td colSpan={5} className="p-2 border border-slate-300 font-bold"><Typography variant="small" color="blue-gray" className="font-bold">Tổng cộng</Typography></td>
                        {selectedMonth === "all" ? (
                          monthlyTotals.map((t, i) => (
                            <td key={i} className="p-2 border border-slate-300 text-center font-bold">
                              {formatVND(t)}
                            </td>
                          ))
                        ) : (
                          <td className="p-2 border border-slate-300 text-center font-bold">
                            {formatVND(monthlyTotals[selectedMonth - 1])}
                          </td>
                        )}
                        <td className="p-2 border border-slate-300 text-center font-bold text-blue-600">
                          {formatVND(totalYearlyCost)}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td
                        colSpan={selectedMonth === "all" ? 18 : 7}
                        className="p-2 border border-slate-300 text-center"
                      >
                        Không có dữ liệu chi phí cho lựa chọn này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
    </div>
  );
};

export default FoReportByContracts;