import React, { useState, useEffect, useMemo } from "react";
import useContracts from "../../hooks/useContracts";
import {
  Card,
  CardBody,
  Typography,
  Select,
  Option,
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";

const FoReportBySupplier = () => {
  const { contracts, fetchContracts } = useContracts();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [openAccordion, setOpenAccordion] = useState({});

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleToggleAccordion = (supplierName) => {
    setOpenAccordion((prev) => ({
      ...prev,
      [supplierName]: !prev[supplierName],
    }));
  };

  const reportData = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return { costsBySupplier: [], grandTotal: 0 };
    }

    const costsBySupplier = {};
    let grandTotal = 0;

    // Ngày đầu tiên của tháng tiếp theo, để so sánh
    const reportDate = new Date(selectedYear, selectedMonth, 1);

    contracts.forEach((contract) => {
      const supplierName = contract.transmissionOwner.name;
      if (!costsBySupplier[supplierName]) {
        costsBySupplier[supplierName] = {
          contracts: [],
          total: 0,
        };
      }

      let contractMonthlyCost = 0;
      if (contract.hiredFos) {
        contract.hiredFos.forEach((fo) => {
          const commissioningDate = new Date(fo.commissioningDate);
          // Chỉ tính chi phí nếu kênh FO đã được đưa vào vận hành
          if (fo.price && commissioningDate < reportDate) {
            contractMonthlyCost += fo.price;
          }
        });
      }

      if (contractMonthlyCost > 0) {
        costsBySupplier[supplierName].contracts.push({
          ...contract,
          monthlyCost: contractMonthlyCost,
        });
        costsBySupplier[supplierName].total += contractMonthlyCost;
        grandTotal += contractMonthlyCost;
      }
    });

    // Lọc và sắp xếp các nhà cung cấp có chi phí trong tháng
    const filteredCosts = Object.entries(costsBySupplier)
      .map(([name, data]) => ({
        supplierName: name,
        ...data,
      }))
      .filter((supplier) => supplier.total > 0)
      .sort((a, b) => a.supplierName.localeCompare(b.supplierName));

    return { costsBySupplier: filteredCosts, grandTotal };
  }, [contracts, selectedYear, selectedMonth]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).reverse();
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);

  const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  return (
    <div className="p-5">
      <Card>
        <CardBody>
          <Typography variant="h5" color="blue-gray" className="mb-4">
            Báo cáo chi phí thuê kênh FO theo nhà cung cấp
          </Typography>

          <div className="flex gap-4 mb-6">
            <div className="w-48">
              <Select label="Chọn năm" value={String(selectedYear)} onChange={(val) => setSelectedYear(Number(val))}>
                {years.map((year) => (<Option key={year} value={String(year)}>{year}</Option>))}
              </Select>
            </div>
            <div className="w-48">
              <Select label="Chọn tháng" value={String(selectedMonth)} onChange={(val) => setSelectedMonth(Number(val))}>
                {months.map((month) => (<Option key={month} value={String(month)}>Tháng {month}</Option>))}
              </Select>
            </div>
          </div>

          <Card className="mb-6 bg-blue-gray-50 p-4">
            <Typography variant="h6">
              Tổng chi phí tháng {selectedMonth}/{selectedYear}:
              <span className="font-bold text-blue-600 ml-2">{formatVND(reportData.grandTotal)}</span>
            </Typography>
          </Card>

          <div className="space-y-2">
            {reportData.costsBySupplier.length > 0 ? (
              reportData.costsBySupplier.map(({ supplierName, contracts, total }) => (
                <Accordion key={supplierName} open={openAccordion[supplierName] || false}>
                  <AccordionHeader onClick={() => handleToggleAccordion(supplierName)} className="border-b-2 border-blue-gray-100">
                    <div className="flex justify-between w-full pr-4">
                      <Typography variant="h6" color="blue-gray">{supplierName}</Typography>
                      <Typography variant="h6" color="blue">{formatVND(total)}</Typography>
                    </div>
                  </AccordionHeader>
                  <AccordionBody>
                    <table className="w-full min-w-max table-auto text-left">
                      <thead>
                        <tr>
                          <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4"><Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Số hợp đồng</Typography></th>
                          <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4"><Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Tên hợp đồng</Typography></th>
                          <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4 text-right"><Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Chi phí tháng</Typography></th>
                        </tr>
                      </thead>
                      <tbody>
                        {contracts.map((contract) => (
                          <tr key={contract.id} className="even:bg-blue-gray-50/50">
                            <td className="p-4"><Typography variant="small" color="blue-gray" className="font-normal">{contract.contractNumber}</Typography></td>
                            <td className="p-4"><Typography variant="small" color="blue-gray" className="font-normal">{contract.contractName}</Typography></td>
                            <td className="p-4 text-right"><Typography variant="small" color="blue-gray" className="font-medium">{formatVND(contract.monthlyCost)}</Typography></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </AccordionBody>
                </Accordion>
              ))
            ) : (
              <Typography>Không có dữ liệu chi phí cho tháng đã chọn.</Typography>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default FoReportBySupplier;

