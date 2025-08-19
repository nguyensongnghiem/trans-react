import React, { useState, useMemo } from "react";
import useContracts from "../../hooks/useContracts";
import {
  Card,
  CardBody,
  Typography,
  Option,
  Button,
} from "@material-tailwind/react";
import Select from 'react-select';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const FoReportBySupplier = () => {
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

  const reportData = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return [];
    }

    const costsBySupplier = {};

    contracts.forEach((contract) => {
      const supplierName = contract.transmissionOwner?.name || "Không xác định";

      if (!costsBySupplier[supplierName]) {
        costsBySupplier[supplierName] = {
          monthlyCosts: Array(12).fill(0),
          totalYearlyCost: 0,
        };
      }

      if (Array.isArray(contract.hiredFoLineList)) {
        contract.hiredFoLineList.forEach((fo) => {
          if (fo.cost && fo.finalDistance) {
            const signedDate = new Date(contract.signedDate);

            if (signedDate.getFullYear() <= selectedYear) {
              for (let i = 0; i < 12; i++) {
                const month = i + 1;
                const reportDate = new Date(selectedYear, month, 1);

                if (signedDate <= reportDate) {
                  costsBySupplier[supplierName].monthlyCosts[i] +=
                    fo.cost * fo.finalDistance;
                }
              }
            }
          }
        });
      }
    });

    const finalReportData = Object.entries(costsBySupplier)
      .map(([name, data]) => {
        const total = data.monthlyCosts.reduce((sum, cost) => sum + cost, 0);
        return {
          supplierName: name,
          monthlyCosts: data.monthlyCosts,
          totalYearlyCost: total,
        };
      })
      .filter((item) => item.totalYearlyCost > 0)
      .sort((a, b) => a.supplierName.localeCompare(b.supplierName));

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
    const startYear = 2020;
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

  // Calculate totals
  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    filteredReportData.forEach(row => {
      row.monthlyCosts.forEach((cost, index) => {
        totals[index] += cost;
      });
    });
    return totals;
  }, [filteredReportData]);

  const totalYearlyCost = useMemo(() => {
    return filteredReportData.reduce((sum, row) => sum + row.totalYearlyCost, 0);
  }, [filteredReportData]);

  const handleExport = () => {
    if (filteredReportData.length === 0) {
      alert("Không có dữ liệu để xuất.");
      return;
    }

    let dataToExport;
    let fileNameMonth;

    if (selectedMonth === "all") {
      const headers = [
        "Nhà Cung cấp",
        ...months.map((m) => `Tháng ${m}`),
        "Tổng Năm",
      ];
      dataToExport = filteredReportData.map((row) => {
        const rowData = {
          "Nhà Cung cấp": row.supplierName,
          ...months.reduce((acc, month, index) => {
            acc[`Tháng ${month}`] = row.monthlyCosts[index];
            return acc;
          }, {}),
          "Tổng Năm": row.totalYearlyCost,
        };
        return rowData;
      });

      // Add total row to data to be exported
      const totalRow = {
        "Nhà Cung cấp": "Tổng cộng",
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
      saveAs(dataBlob, `BaoCaoChiPhiFO_${fileNameMonth}_${selectedYear}.xlsx`);
    } else {
      dataToExport = filteredReportData.map((row) => {
        const monthlyCost = row.monthlyCosts[selectedMonth - 1];
        return {
          "Nhà Cung cấp": row.supplierName,
          "Chi phí tháng": monthlyCost,
          "Tổng năm": row.totalYearlyCost,
        };
      });
      
      // Add total row to data to be exported for a single month
      const totalRow = {
        "Nhà Cung cấp": "Tổng cộng",
        "Chi phí tháng": monthlyTotals[selectedMonth - 1],
        "Tổng năm": totalYearlyCost,
      };
      dataToExport.push(totalRow);

      fileNameMonth = `Thang${selectedMonth}`;

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        `BaoCaoThang${selectedMonth}`
      );
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const dataBlob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(dataBlob, `BaoCaoChiPhiFO_${fileNameMonth}_${selectedYear}.xlsx`);
    }
  };

  return (
    <div className="p-5">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <Typography
              variant="h5"
              color="blue-gray"
              className="text-center md:text-left"
            >
              Báo cáo tổng hợp chi phí thuê kênh FO năm {selectedYear}
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
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0-4.5-4.5M12 16.5V3"
                />
              </svg>
              Xuất Excel
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="w-48">
              <Select
                options={years.map(year => ({ value: String(year), label: String(year) }))}
                value={{ value: String(selectedYear), label: String(selectedYear) }}
                onChange={(selectedOption) => setSelectedYear(Number(selectedOption.value))}
                placeholder="Chọn năm"
                classNamePrefix="react-select"
              />
            </div>
            <div className="w-48">
              <Select
                options={[{ value: 'all', label: 'Tất cả các tháng' }, ...months.map(month => ({ value: String(month), label: `Tháng ${month}` }))]}
                value={selectedMonth === 'all' ? { value: 'all', label: 'Tất cả các tháng' } : { value: String(selectedMonth), label: `Tháng ${selectedMonth}` }}
                onChange={(selectedOption) => setSelectedMonth(selectedOption ? selectedOption.value : 'all')}
                placeholder="Chọn tháng"
                classNamePrefix="react-select"
              />
            </div>
            <div className="w-48">
              <Select
                options={[{ value: 'all', label: 'Tất cả' }, ...suppliers.filter(s => s !== 'Tất cả').map(supplier => ({ value: supplier, label: supplier }))]}
                value={selectedSupplier === 'all' ? { value: 'all', label: 'Tất cả' } : { value: selectedSupplier, label: selectedSupplier }}
                onChange={(selectedOption) => setSelectedSupplier(selectedOption ? selectedOption.value : 'all')}
                placeholder="Chọn nhà cung cấp"
                classNamePrefix="react-select"
              />
            </div>
          </div>

          <div className="h-[60vh] overflow-y-auto">
            <div className="min-w-full table-container">
              <table className="w-full text-left border-collapse border border-slate-400 text-sm">
                <thead className="bg-white shadow sticky top-0 z-1">
                  <tr>
                    <th className="p-2 border border-slate-300"><Typography variant="small" color="blue-gray" className="font-semibold leading-none opacity-70">STT</Typography></th>
                    <th className="p-2 border border-slate-300"><Typography variant="small" color="blue-gray" className="font-semibold leading-none opacity-70">Nhà Cung cấp</Typography></th>
                    {selectedMonth === "all" ? (
                      <>
                        {months.map((month) => (
                          <th key={month} className="p-2 border border-slate-300 text-center">
                            <Typography variant="small" color="blue-gray" className="font-semibold leading-none opacity-70">
                              {`Tháng ${month}`}
                            </Typography>
                          </th>
                        ))}
                      </>
                    ) : (
                      <th className="p-2 border border-slate-300 text-center">
                        <Typography variant="small" color="blue-gray" className="font-semibold leading-none opacity-70">
                          {`Tháng ${selectedMonth}`}
                        </Typography>
                      </th>
                    )}
                    <th className="p-2 border border-slate-300 text-center"><Typography variant="small" color="blue-gray" className="font-semibold leading-none opacity-70">Tổng Năm</Typography></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReportData.length > 0 ? (
                    <>
                      {filteredReportData.map((row, index) => (
                        <tr key={index} className="even:bg-blue-gray-50/50">
                          <td className="p-2 border border-slate-300"><Typography variant="small" color="blue-gray" className="font-normal">{index + 1}</Typography></td>
                          <td className="p-2 border border-slate-300"><Typography variant="small" color="blue-gray" className="font-normal">{row.supplierName}</Typography></td>
                          {selectedMonth === "all" ? (
                            <>
                              {row.monthlyCosts.map((cost, monthIndex) => (
                                <td key={monthIndex} className="p-2 border border-slate-300 text-center">
                                  <Typography variant="small" color="blue-gray" className="font-normal">{formatVND(cost)}</Typography>
                                </td>
                              ))}
                            </>
                          ) : (
                            <td className="p-2 border border-slate-300 text-center">
                              <Typography variant="small" color="blue-gray" className="font-normal">{formatVND(row.monthlyCosts[selectedMonth - 1])}</Typography>
                            </td>
                          )}
                          <td className="p-2 border border-slate-300 text-center">
                            <Typography variant="small" color="blue" className="font-semibold">{formatVND(row.totalYearlyCost)}</Typography>
                          </td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr className="border-t border-blue-gray-200 bg-blue-gray-50">
                        <td className="p-2 border border-slate-300 font-bold text-black" colSpan={2}><Typography variant="small" color="blue-gray" className="font-bold">Tổng cộng</Typography></td>
                        {selectedMonth === "all" ? (
                          <>
                            {monthlyTotals.map((total, index) => (
                              <td key={index} className="p-2 border border-slate-300 text-center font-bold text-black">
                                <Typography variant="small" color="blue-gray" className="font-bold">{formatVND(total)}</Typography>
                              </td>
                            ))}
                          </>
                        ) : (
                          <td className="p-2 border border-slate-300 text-center font-bold text-black">
                            <Typography variant="small" color="blue-gray" className="font-bold">{formatVND(monthlyTotals[selectedMonth - 1])}</Typography>
                          </td>
                        )}
                        <td className="p-2 border border-slate-300 text-center font-bold text-black">
                          <Typography variant="small" color="blue" className="font-bold">{formatVND(totalYearlyCost)}</Typography>
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td
                        colSpan={selectedMonth === "all" ? 15 : 4}
                        className="p-2 border border-slate-300 text-center"
                      >
                        <Typography variant="small" color="blue-gray" className="font-normal">
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

export default FoReportBySupplier;
