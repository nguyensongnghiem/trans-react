import React, { useState, useMemo } from "react";
import useContracts from "../../hooks/useContracts";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import Select from "react-select";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const FoReportByContracts = () => {
  const { contracts } = useContracts();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(["all"]);
  const [selectedSupplier, setSelectedSupplier] = useState(["all"]);

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
            costsByContract[contractNumber].totalDistance = Math.round(
              (costsByContract[contractNumber].totalDistance || 0) +
                fo.finalDistance
            );
            costsByContract[contractNumber].totalFo =
              (costsByContract[contractNumber].totalFo || 0) + 1;
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
    if (!selectedSupplier.includes("all")) {
      filteredData = filteredData.filter((row) =>
        selectedSupplier.includes(row.supplierName)
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
    let headers;
    let fileNameMonth;

    if (selectedMonth.includes("all")) {
      headers = [
        "Mã Hợp đồng",
        "Nhà Cung cấp",
        "Số tuyến",
        "Số km",
        ...months.map((m) => `Tháng ${m}`),
        "Tổng Năm",
      ];
      dataToExport = filteredReportData.map((row) => {
        return {
          "Mã Hợp đồng": row.contractId,
          "Nhà Cung cấp": row.supplierName,
          "Số tuyến": row.totalFo,
          "Số km": row.totalDistance,
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
        "Số tuyến": monthlyTotals.totalFo, // Assuming you have this in monthlyTotals
        "Số km": monthlyTotals.totalDistance, // Assuming you have this in monthlyTotals
        ...months.reduce((acc, month, index) => {
          acc[`Tháng ${month}`] = monthlyTotals[index];
          return acc;
        }, {}),
        "Tổng Năm": totalYearlyCost,
      };
      dataToExport.push(totalRow);

      fileNameMonth = "TatCaCacThang";
    } else {
      const selectedMonthNumbers = selectedMonth.map(Number);
      headers = [
        "Mã Hợp đồng",
        "Nhà Cung cấp",
        "Số tuyến",
        "Số km",
        ...selectedMonthNumbers.map((m) => `Tháng ${m}`),
        "Tổng Năm",
      ];
      dataToExport = filteredReportData.map((row) => {
        const monthlyCostsSelected = selectedMonthNumbers.reduce(
          (acc, monthNum) => {
            acc[`Tháng ${monthNum}`] = row.monthlyCosts[monthNum - 1];
            return acc;
          },
          {}
        );
        return {
          "Mã Hợp đồng": row.contractId,
          "Nhà Cung cấp": row.supplierName,
          "Số tuyến": row.totalFo,
          "Số km": row.totalDistance,
          ...monthlyCostsSelected,
          "Tổng Năm": row.totalYearlyCost,
        };
      });

      const totalRow = {
        "Mã Hợp đồng": "Tổng cộng",
        "Nhà Cung cấp": "",
        "Số tuyến": monthlyTotals.totalFo, // Assuming you have this in monthlyTotals
        "Số km": monthlyTotals.totalDistance, // Assuming you have this in monthlyTotals
        ...selectedMonthNumbers.reduce((acc, monthNum) => {
          acc[`Tháng ${monthNum}`] = monthlyTotals[monthNum - 1];
          return acc;
        }, {}),
        "Tổng Năm": totalYearlyCost,
      };
      dataToExport.push(totalRow);

      fileNameMonth = `Thang${selectedMonth.join("_")}`;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
      header: headers,
    });

    // Calculate column widths
    const columnWidths = headers.map((header) => ({
      wch: header.length + 2, // Start with header length + some padding
    }));

    dataToExport.forEach((row) => {
      Object.values(row).forEach((cellValue, colIndex) => {
        const value = String(cellValue || "");
        if (value.length > columnWidths[colIndex].wch) {
          columnWidths[colIndex].wch = value.length + 2; // Add padding
        }
      });
    });

    worksheet["!cols"] = columnWidths;

    // Iterate through all cells to apply styles
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    const totalRowIndex = dataToExport.length - 1;

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];

        if (!cell) continue;

        // Initialize style object if it doesn't exist
        if (!cell.s) cell.s = {};

        // Apply bolding
        if (R === 0 || R === totalRowIndex + 1) {
          // Header row (R=0) or total row (R=totalRowIndex + 1)
          cell.s.font = { bold: true };
        }

        // Apply currency format (only if it's a number and a currency column)
        const headerName = headers[C];
        const isMonthlyCostColumn =
          headerName && headerName.startsWith("Tháng");
        const isTotalYearColumn =
          headerName === "Tổng Năm" || headerName === "Tổng năm";
        const isChiPhiThangColumn = headerName === "Chi phí tháng";

        if (
          typeof cell.v === "number" &&
          (isMonthlyCostColumn || isTotalYearColumn || isChiPhiThangColumn)
        ) {
          cell.z = "#,##0";
        }

        // Apply borders
        cell.s.border = {
          top: { style: "thin", color: { auto: 1 } },
          bottom: { style: "thin", color: { auto: 1 } },
          left: { style: "thin", color: { auto: 1 } },
          right: { style: "thin", color: { auto: 1 } },
        };
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `BaoCaoNam${selectedYear}`
    );
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(
      dataBlob,
      `BaoCaoChiPhiFO_HopDong_${fileNameMonth}_${selectedYear}.xlsx`
    );
  };

  return (
    <div className="p-5">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <Typography
          variant="h5"
          color="blue-gray"
          className="text-center md:text-left"
        >
          Báo cáo chi phí thuê kênh FO theo hợp đồng năm {selectedYear}
        </Typography>
        <Button
          variant="filled"
          color="green"
          size="sm"
          className="flex items-center gap-2"
          onClick={handleExport}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
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
        <div className="flex-1">
          <div className="flex flex-col">
            <label className="mb-2 font-bold text-gray-700">Chọn năm</label>
            <Select
              options={years.map((year) => ({
                value: String(year),
                label: String(year),
              }))}
              value={{
                value: String(selectedYear),
                label: String(selectedYear),
              }}
              onChange={(selectedOption) =>
                setSelectedYear(Number(selectedOption.value))
              }
              placeholder="Chọn năm"
              classNamePrefix="react-select"              
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-col">
            <label className="mb-2 font-bold text-gray-700">Chọn tháng</label>
            <Select
              isMulti
              closeMenuOnSelect={false}
              options={[
                { value: "all", label: "Tất cả các tháng" },
                ...months.map((month) => ({
                  value: String(month),
                  label: `Tháng ${month}`,
                })),
              ]}
              value={
                selectedMonth.includes("all")
                  ? [{ value: "all", label: "Tất cả các tháng" }]
                  : selectedMonth.map((month) => ({
                      value: String(month),
                      label: `Tháng ${month}`,
                    }))
              }
              onChange={(selectedOptions) => {
                if (
                  selectedOptions &&
                  selectedOptions.some((option) => option.value === "all")
                ) {
                  setSelectedMonth(["all"]); // If "all" is selected, only "all" should be in the array
                } else {
                  setSelectedMonth(
                    selectedOptions
                      ? selectedOptions.map((option) => option.value)
                      : []
                  );
                }
              }}
              placeholder="Chọn tháng"
              classNamePrefix="react-select"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-col">
            <label className="mb-2 font-bold text-gray-700">Chọn nhà cung cấp</label>
            <Select
              isMulti
              closeMenuOnSelect={false}
              options={suppliers.map((supplier) => ({
                value: supplier === "Tất cả" ? "all" : supplier,
                label: supplier,
              }))}
              value={
                selectedSupplier.includes("all")
                  ? [{ value: "all", label: "Tất cả" }]
                  : selectedSupplier.map((supplier) => ({
                      value: supplier,
                      label: supplier,
                    }))
              }
              onChange={(selectedOptions) => {
                if (
                  selectedOptions &&
                  selectedOptions.some((option) => option.value === "all")
                ) {
                  setSelectedSupplier(["all"]); // If "all" is selected, only "all" should be in the array
                } else {
                  setSelectedSupplier(
                    selectedOptions
                      ? selectedOptions.map((option) => option.value)
                      : []
                  );
                }
              }}
              placeholder="Chọn nhà cung cấp"
              classNamePrefix="react-select"
            />
          </div>
        </div>
      </div>

      {/* Wrapper cho phép cuộn độc lập */}
      <div className="h-[60vh] overflow-y-auto">
        <div className="min-w-full table-container">
          <table className="w-full text-left border-collapse border border-slate-400 text-sm">
            <thead className="bg-white shadow sticky top-0 z-1">
              <tr>
                <th className="p-2 border border-slate-300">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold leading-none opacity-70"
                  >
                    STT
                  </Typography>
                </th>
                <th className="p-2 border border-slate-300">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold leading-none opacity-70"
                  >
                    Mã Hợp đồng
                  </Typography>
                </th>
                <th className="p-2 border border-slate-300">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold leading-none opacity-70"
                  >
                    Nhà Cung cấp
                  </Typography>
                </th>
                <th className="p-2 border border-slate-300">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold leading-none opacity-70"
                  >
                    Số tuyến
                  </Typography>
                </th>
                <th className="p-2 border border-slate-300">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold leading-none opacity-70"
                  >
                    Số km
                  </Typography>
                </th>
                {selectedMonth.includes("all")
                  ? months.map((m) => (
                      <th
                        key={m}
                        className="p-2 border border-slate-300 text-right"
                      >
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold leading-none opacity-70"
                        >
                          Tháng {m}
                        </Typography>
                      </th>
                    ))
                  : selectedMonth.map((m) => (
                      <th
                        key={m}
                        className="p-2 border border-slate-300 text-right"
                      >
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold leading-none opacity-70"
                        >
                          Tháng {m}
                        </Typography>
                      </th>
                    ))}
                <th className="p-2 border border-slate-300 text-right">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold leading-none opacity-70"
                  >
                    Tổng Năm
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReportData.length > 0 ? (
                <>
                  {filteredReportData.map((row, index) => (
                    <tr key={index} className="even:bg-blue-gray-50/50">
                      <td className="p-2 border border-slate-300">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal"
                        >
                          {index + 1}
                        </Typography>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal"
                        >
                          {row.contractId}
                        </Typography>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal"
                        >
                          {row.supplierName}
                        </Typography>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal"
                        >
                          {row.totalFo}
                        </Typography>
                      </td>
                      <td className="p-2 border border-slate-300">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal"
                        >
                          {row.totalDistance}
                        </Typography>
                      </td>
                      {selectedMonth.includes("all")
                        ? row.monthlyCosts.map((cost, i) => (
                            <td
                              key={i}
                              className="p-1 border border-slate-300 text-right"
                            >
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-normal"
                              >
                                {formatVND(cost)}
                              </Typography>
                            </td>
                          ))
                        : selectedMonth.map((month, i) => (
                            <td
                              key={i}
                              className="p-2 border border-slate-300 text-right"
                            >
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-normal"
                              >
                                {formatVND(row.monthlyCosts[Number(month) - 1])}
                              </Typography>
                            </td>
                          ))}
                      <td className="p-2 border border-slate-300 text-right">
                        <Typography
                          variant="small"
                          color="blue"
                          className="font-semibold"
                        >
                          {formatVND(row.totalYearlyCost)}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                  {/* Tổng cộng */}
                  <tr className="border-t border-blue-gray-200 bg-blue-gray-50">
                    <td
                      colSpan={5}
                      className="p-2 border border-slate-300 font-bold text-black text-center"
                    >
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-bold"
                      >
                        Tổng cộng
                      </Typography>
                    </td>
                    {selectedMonth.includes("all")
                      ? monthlyTotals.map((t, i) => (
                          <td
                            key={i}
                            className="p-2 border border-slate-300 text-center font-bold text-black"
                          >
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-bold"
                            >
                              {formatVND(t)}
                            </Typography>
                          </td>
                        ))
                      : selectedMonth.map((month, i) => (
                          <td
                            key={i}
                            className="p-2 border border-slate-300 text-center font-bold text-black"
                          >
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-bold"
                            >
                              {formatVND(monthlyTotals[Number(month) - 1])}
                            </Typography>
                          </td>
                        ))}
                    <td className="p-2 border border-slate-300 text-right font-bold text-black">
                      <Typography
                        variant="small"
                        color="blue"
                        className="font-bold"
                      >
                        {formatVND(totalYearlyCost)}
                      </Typography>
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td
                    colSpan={selectedMonth === "all" ? 18 : 7}
                    className="p-2 border border-slate-300 text-center"
                  >
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal"
                    >
                      Không có dữ liệu chi phí cho lựa chọn này.
                    </Typography>
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
