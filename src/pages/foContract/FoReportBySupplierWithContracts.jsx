import React, { useState, useMemo } from "react";
import useContracts from "../../hooks/useContracts";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import Select from "react-select";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const FoReportBySupplierWithContracts = () => {
  const { contracts } = useContracts();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(["all"]);
  const [selectedSupplier, setSelectedSupplier] = useState(["all"]);
  const [expandedSuppliers, setExpandedSuppliers] = useState({}); // State để quản lý các nhà cung cấp được mở rộng

  const formatVND = (value) => {
    if (typeof value !== "number" || isNaN(value)) {
      return "0 ₫";
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  // Logic tính toán và nhóm dữ liệu theo nhà cung cấp
  const reportData = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return [];
    }

    const costsBySupplier = {};

    contracts.forEach((contract) => {
      // Lọc theo nhà cung cấp nếu được chọn
      const isSupplierSelected = selectedSupplier.includes("all") || selectedSupplier.includes(contract.transmissionOwner?.name);
      if (!isSupplierSelected) {
        return;
      }

      const supplierName = contract.transmissionOwner?.name || "Không xác định";
      const signedDate = new Date(contract.signedDate);
      const contractNumber = contract.contractNumber || "Không xác định";

      // Lấy năm và tháng ký hợp đồng
      const signedYear = signedDate.getFullYear();
      const signedMonth = signedDate.getMonth() + 1; // getMonth() returns 0-based index

      // Bỏ qua hợp đồng nếu năm ký lớn hơn năm được chọn
      if (selectedYear < signedYear) {
        return;
      }

      // Khởi tạo đối tượng nhà cung cấp nếu chưa tồn tại
      if (!costsBySupplier[supplierName]) {
        costsBySupplier[supplierName] = {
          supplierName: supplierName,
          monthlyTotals: Array(12).fill(0),
          totalYearlyCost: 0,
          contracts: [],
        };
      }

      const contractData = {
        contractNumber: contractNumber,
        monthlyCosts: Array(12).fill(0),
        totalYearlyCost: 0,
        totalFo: (contract.hiredFoLineList || []).length,
        totalDistance: (contract.hiredFoLineList || []).reduce((sum, fo) => sum + (fo.finalDistance || 0), 0),
      };

      // Vòng lặp tính chi phí cho từng tháng của hợp đồng
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const currentMonth = monthIndex + 1;

        if (selectedYear === signedYear) {
          if (currentMonth >= signedMonth) {
            if (Array.isArray(contract.hiredFoLineList)) {
              contract.hiredFoLineList.forEach((fo) => {
                contractData.monthlyCosts[monthIndex] += (fo.cost * fo.finalDistance) || 0;
              });
            }
          }
        } else if (selectedYear > signedYear) {
          if (Array.isArray(contract.hiredFoLineList)) {
            contract.hiredFoLineList.forEach((fo) => {
              contractData.monthlyCosts[monthIndex] += (fo.cost * fo.finalDistance) || 0;
            });
          }
        }
      }

      // Tính tổng chi phí cả năm cho hợp đồng và cộng vào tổng của nhà cung cấp
      contractData.totalYearlyCost = contractData.monthlyCosts.reduce((sum, cost) => sum + cost, 0);
      costsBySupplier[supplierName].totalYearlyCost += contractData.totalYearlyCost;

      // Cộng chi phí hàng tháng của hợp đồng vào tổng của nhà cung cấp
      contractData.monthlyCosts.forEach((cost, index) => {
        costsBySupplier[supplierName].monthlyTotals[index] += cost;
      });

      // Thêm hợp đồng vào danh sách của nhà cung cấp
      costsBySupplier[supplierName].contracts.push(contractData);
    });

    // Lọc bỏ các nhà cung cấp không có chi phí trong năm được chọn
    const finalReportData = Object.values(costsBySupplier)
      .filter(supplier => supplier.totalYearlyCost > 0);

    return finalReportData;
  }, [contracts, selectedYear, selectedSupplier]);

  // Lọc dữ liệu hiển thị theo tháng
  const filteredReportData = useMemo(() => {
    if (selectedMonth.includes("all")) {
      return reportData;
    }
    return reportData.filter((supplier) => {
      // Lọc nhà cung cấp nếu tổng chi phí của họ trong các tháng được chọn > 0
      const totalSelectedMonthsCost = selectedMonth.reduce((sum, month) => sum + supplier.monthlyTotals[Number(month) - 1], 0);
      return totalSelectedMonthsCost > 0;
    }).map(supplier => {
      // Tạo một bản sao của dữ liệu với chi phí hàng tháng được lọc
      const newMonthlyTotals = Array(12).fill(0);
      const newContracts = supplier.contracts.map(contract => {
        const newContractMonthlyCosts = Array(12).fill(0);
        selectedMonth.forEach(month => {
          const monthIndex = Number(month) - 1;
          newContractMonthlyCosts[monthIndex] = contract.monthlyCosts[monthIndex];
          newMonthlyTotals[monthIndex] += contract.monthlyCosts[monthIndex];
        });
        const newContractTotal = newContractMonthlyCosts.reduce((sum, cost) => sum + cost, 0);
        return {
          ...contract,
          monthlyCosts: newContractMonthlyCosts,
          totalYearlyCost: newContractTotal,
        };
      });
      const newSupplierTotal = newMonthlyTotals.reduce((sum, cost) => sum + cost, 0);
      return {
        ...supplier,
        monthlyTotals: newMonthlyTotals,
        contracts: newContracts,
        totalYearlyCost: newSupplierTotal,
      };
    });
  }, [reportData, selectedMonth]);

  // Tính tổng hàng cuối cho toàn bộ báo cáo
  const grandTotal = useMemo(() => {
    const monthlyTotals = Array(12).fill(0);
    let totalYearlyCost = 0;

    filteredReportData.forEach((supplier) => {
      supplier.monthlyTotals.forEach((cost, index) => {
        monthlyTotals[index] += cost;
      });
      totalYearlyCost += supplier.totalYearlyCost;
    });

    return { monthlyTotals, totalYearlyCost };
  }, [filteredReportData]);

  const headers = useMemo(() => {
    const baseHeaders = ["Nhà Cung Cấp", "Số tuyến", "Số km"];
    const monthHeaders = selectedMonth.includes("all")
      ? Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`)
      : selectedMonth.sort((a, b) => Number(a) - Number(b)).map((m) => `Tháng ${m}`);
    return [...baseHeaders, ...monthHeaders, "Tổng năm"];
  }, [selectedMonth]);

  const toggleExpand = (supplierName) => {
    setExpandedSuppliers(prevState => ({
      ...prevState,
      [supplierName]: !prevState[supplierName],
    }));
  };

  const exportToExcel = () => {
    if (filteredReportData.length === 0) {
      alert("Không có dữ liệu để xuất.");
      return;
    }

    let dataToExport = [];
    
    // Thêm dữ liệu từng nhà cung cấp và các hợp đồng con
    filteredReportData.forEach(supplier => {
      // Thêm hàng tổng của nhà cung cấp
      const supplierRow = {
        "Nhà Cung Cấp": supplier.supplierName,
        "Số tuyến": supplier.contracts.reduce((sum, c) => sum + c.totalFo, 0),
        "Số km": supplier.contracts.reduce((sum, c) => sum + c.totalDistance, 0),
        ...supplier.monthlyTotals.reduce((acc, cost, index) => {
          acc[`Tháng ${index + 1}`] = cost;
          return acc;
        }, {}),
        "Tổng năm": supplier.totalYearlyCost,
      };
      dataToExport.push(supplierRow);

      // Thêm dữ liệu từng hợp đồng con (dòng chi tiết)
      supplier.contracts.forEach(contract => {
        const contractRow = {
          "Nhà Cung Cấp": `  ↳ ${contract.contractNumber}`, // Dấu xuống dòng để phân biệt
          "Số tuyến": contract.totalFo,
          "Số km": contract.totalDistance,
          ...contract.monthlyCosts.reduce((acc, cost, index) => {
            acc[`Tháng ${index + 1}`] = cost;
            return acc;
          }, {}),
          "Tổng năm": contract.totalYearlyCost,
        };
        dataToExport.push(contractRow);
      });
    });

    // Thêm hàng tổng cuối cùng
    const totalRow = {
      "Nhà Cung Cấp": "Tổng cộng",
      "Số tuyến": filteredReportData.reduce((sum, s) => sum + s.contracts.reduce((csum, c) => csum + c.totalFo, 0), 0),
      "Số km": filteredReportData.reduce((sum, s) => sum + s.contracts.reduce((csum, c) => csum + c.totalDistance, 0), 0),
      ...grandTotal.monthlyTotals.reduce((acc, cost, index) => {
        acc[`Tháng ${index + 1}`] = cost;
        return acc;
      }, {}),
      "Tổng năm": grandTotal.totalYearlyCost,
    };
    dataToExport.push(totalRow);
    
    // Tạo worksheet và áp dụng style
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo theo nhà cung cấp");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "BaoCaoTheoNhaCungCap.xlsx");
  };

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

  return (
    <div className="p-5">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <Typography
          variant="h5"
          color="blue-gray"
          className="text-center md:text-left"
        >
          Báo cáo chi phí thuê kênh FO theo nhà cung cấp năm {selectedYear}
        </Typography>
        <Button
          variant="filled"
          color="green"
          size="sm"
          className="flex items-center gap-2"
          onClick={exportToExcel}
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
                  setSelectedMonth(["all"]);
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
                  setSelectedSupplier(["all"]);
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

      {/* Bảng dữ liệu */}
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
                    Nhà Cung cấp / Mã Hợp đồng
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
                  {filteredReportData.map((supplier, index) => (
                    <React.Fragment key={index}>
                      {/* Hàng tổng của nhà cung cấp */}
                      <tr 
                        className="even:bg-blue-gray-50/50 cursor-pointer"
                        onClick={() => toggleExpand(supplier.supplierName)}
                      >
                        <td className="p-2 border border-slate-300">
                          <Typography variant="small" color="blue-gray" className="font-bold">
                            {index + 1}
                          </Typography>
                        </td>
                        <td className="p-2 border border-slate-300">
                          <Typography variant="small" color="blue-gray" className="font-bold">
                            {expandedSuppliers[supplier.supplierName] ? "▼" : "►"} {supplier.supplierName}
                          </Typography>
                        </td>
                        <td className="p-2 border border-slate-300">
                          <Typography variant="small" color="blue-gray" className="font-normal">
                            {supplier.contracts.reduce((sum, c) => sum + c.totalFo, 0)}
                          </Typography>
                        </td>
                        <td className="p-2 border border-slate-300">
                          <Typography variant="small" color="blue-gray" className="font-normal">
                            {supplier.contracts.reduce((sum, c) => sum + c.totalDistance, 0)}
                          </Typography>
                        </td>
                        {selectedMonth.includes("all")
                          ? supplier.monthlyTotals.map((cost, i) => (
                              <td key={i} className="p-1 border border-slate-300 text-right">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                  {formatVND(cost)}
                                </Typography>
                              </td>
                            ))
                          : selectedMonth.map((month, i) => (
                              <td key={i} className="p-2 border border-slate-300 text-right">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                  {formatVND(supplier.monthlyTotals[Number(month) - 1])}
                                </Typography>
                              </td>
                            ))}
                        <td className="p-2 border border-slate-300 text-right">
                          <Typography variant="small" color="blue" className="font-semibold">
                            {formatVND(supplier.totalYearlyCost)}
                          </Typography>
                        </td>
                      </tr>
                      {/* Hàng chi tiết hợp đồng, chỉ hiển thị nếu được mở rộng */}
                      {expandedSuppliers[supplier.supplierName] && (
                        supplier.contracts.map((contract, contractIndex) => (
                          <tr key={`${index}-${contractIndex}`} className="even:bg-blue-gray-50/50">
                            <td className="p-2 border border-slate-300"></td>
                            <td className="p-2 border border-slate-300 pl-8">
                              <Typography variant="small" color="blue-gray" className="font-normal">
                                {contract.contractNumber}
                              </Typography>
                            </td>
                            <td className="p-2 border border-slate-300">
                              <Typography variant="small" color="blue-gray" className="font-normal">
                                {contract.totalFo}
                              </Typography>
                            </td>
                            <td className="p-2 border border-slate-300">
                              <Typography variant="small" color="blue-gray" className="font-normal">
                                {contract.totalDistance}
                              </Typography>
                            </td>
                            {selectedMonth.includes("all")
                              ? contract.monthlyCosts.map((cost, i) => (
                                  <td key={i} className="p-1 border border-slate-300 text-right">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                      {formatVND(cost)}
                                    </Typography>
                                  </td>
                                ))
                              : selectedMonth.map((month, i) => (
                                  <td key={i} className="p-2 border border-slate-300 text-right">
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                      {formatVND(contract.monthlyCosts[Number(month) - 1])}
                                    </Typography>
                                  </td>
                                ))}
                            <td className="p-2 border border-slate-300 text-right">
                              <Typography variant="small" color="blue" className="font-semibold">
                                {formatVND(contract.totalYearlyCost)}
                              </Typography>
                            </td>
                          </tr>
                        ))
                      )}
                    </React.Fragment>
                  ))}
                  {/* Hàng tổng cộng */}
                  <tr className="border-t border-blue-gray-200 bg-blue-gray-50">
                    <td
                      colSpan={2}
                      className="p-2 border border-slate-300 font-bold text-black text-center"
                    >
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        Tổng cộng
                      </Typography>
                    </td>
                    <td className="p-2 border border-slate-300 font-bold text-black text-center">
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        {filteredReportData.reduce((sum, s) => sum + s.contracts.reduce((csum, c) => csum + c.totalFo, 0), 0)}
                      </Typography>
                    </td>
                    <td className="p-2 border border-slate-300 font-bold text-black text-center">
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        {filteredReportData.reduce((sum, s) => sum + s.contracts.reduce((csum, c) => csum + c.totalDistance, 0), 0)}
                      </Typography>
                    </td>
                    {selectedMonth.includes("all")
                      ? grandTotal.monthlyTotals.map((t, i) => (
                          <td key={i} className="p-2 border border-slate-300 text-right font-bold text-black">
                            <Typography variant="small" color="blue-gray" className="font-bold">
                              {formatVND(t)}
                            </Typography>
                          </td>
                        ))
                      : selectedMonth.map((month, i) => (
                          <td key={i} className="p-2 border border-slate-300 text-right font-bold text-black">
                            <Typography variant="small" color="blue-gray" className="font-bold">
                              {formatVND(grandTotal.monthlyTotals[Number(month) - 1])}
                            </Typography>
                          </td>
                        ))}
                    <td className="p-2 border border-slate-300 text-right font-bold text-black">
                      <Typography variant="small" color="blue" className="font-bold">
                        {formatVND(grandTotal.totalYearlyCost)}
                      </Typography>
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={18} className="p-2 border border-slate-300 text-center">
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

export default FoReportBySupplierWithContracts;
