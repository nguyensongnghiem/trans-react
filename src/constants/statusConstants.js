// Status Enum Constants for Frontend
// This file contains all status enums used in the backend, with display labels and colors

export const SiteStatus = {
    OPERATING: 'OPERATING',
    UNDER_CONSTRUCTION: 'UNDER_CONSTRUCTION',
    PLANNED: 'PLANNED',
    DISABLED: 'DISABLED',
    DECOMMISSIONED: 'DECOMMISSIONED'
};

export const SiteStatusLabels = {
    [SiteStatus.OPERATING]: 'Đang khai thác',
    [SiteStatus.UNDER_CONSTRUCTION]: 'Đang xây dựng',
    [SiteStatus.PLANNED]: 'Đang quy hoạch',
    [SiteStatus.DISABLED]: 'Tạm ngưng',
    [SiteStatus.DECOMMISSIONED]: 'Đã thanh lý'
};

export const SiteStatusColors = {
    [SiteStatus.OPERATING]: 'green',
    [SiteStatus.UNDER_CONSTRUCTION]: 'blue',
    [SiteStatus.PLANNED]: 'gray',
    [SiteStatus.DISABLED]: 'orange',
    [SiteStatus.DECOMMISSIONED]: 'red'
};

export const LeaseLineStatus = {
    OPERATING: 'OPERATING',
    DISABLED: 'DISABLED',
    BROKEN: 'BROKEN',
    PENDING: 'PENDING',
    EXPIRED: 'EXPIRED'
};

export const LeaseLineStatusLabels = {
    [LeaseLineStatus.OPERATING]: 'Đang khai thác',
    [LeaseLineStatus.DISABLED]: 'Đã dừng khai thác',
    [LeaseLineStatus.BROKEN]: 'Đang gặp sự cố',
    [LeaseLineStatus.PENDING]: 'Chờ kích hoạt',
    [LeaseLineStatus.EXPIRED]: 'Hết hạn hợp đồng'
};

export const LeaseLineStatusColors = {
    [LeaseLineStatus.OPERATING]: 'green',
    [LeaseLineStatus.DISABLED]: 'orange',
    [LeaseLineStatus.BROKEN]: 'red',
    [LeaseLineStatus.PENDING]: 'blue',
    [LeaseLineStatus.EXPIRED]: 'gray'
};

export const DeviceStatus = {
    OPERATING: 'OPERATING',
    DISABLED: 'DISABLED',
    BROKEN: 'BROKEN',
    REPAIRING: 'REPAIRING',
    RETIRED: 'RETIRED',
    DECOMMISSIONED: 'DECOMMISSIONED'
};

export const DeviceStatusLabels = {
    [DeviceStatus.OPERATING]: 'Đang khai thác',
    [DeviceStatus.DISABLED]: 'Đã dừng khai thác',
    [DeviceStatus.BROKEN]: 'Đang gặp sự cố',
    [DeviceStatus.REPAIRING]: 'Đang sửa chữa',
    [DeviceStatus.RETIRED]: 'Tạm ngưng chờ thanh lý',
    [DeviceStatus.DECOMMISSIONED]: 'Đã thanh lý'
};

export const DeviceStatusColors = {
    [DeviceStatus.OPERATING]: 'green',
    [DeviceStatus.DISABLED]: 'orange',
    [DeviceStatus.BROKEN]: 'red',
    [DeviceStatus.REPAIRING]: 'yellow',
    [DeviceStatus.RETIRED]: 'gray',
    [DeviceStatus.DECOMMISSIONED]: 'red'
};

export const FoLineStatus = {
    OPERATING: 'OPERATING',
    DISABLED: 'DISABLED',
    BROKEN: 'BROKEN',
    REPAIRING: 'REPAIRING',
    RETIRED: 'RETIRED',
    DECOMMISSIONED: 'DECOMMISSIONED'
};

export const FoLineStatusLabels = {
    [FoLineStatus.OPERATING]: 'Đang khai thác',
    [FoLineStatus.DISABLED]: 'Đã dừng khai thác',
    [FoLineStatus.BROKEN]: 'Đang gặp sự cố',
    [FoLineStatus.REPAIRING]: 'Đang sửa chữa',
    [FoLineStatus.RETIRED]: 'Tạm ngưng chờ thanh lý',
    [FoLineStatus.DECOMMISSIONED]: 'Đã thanh lý'
};

export const FoLineStatusColors = {
    [FoLineStatus.OPERATING]: 'green',
    [FoLineStatus.DISABLED]: 'orange',
    [FoLineStatus.BROKEN]: 'red',
    [FoLineStatus.REPAIRING]: 'yellow',
    [FoLineStatus.RETIRED]: 'gray',
    [FoLineStatus.DECOMMISSIONED]: 'red'
};

export const UserState = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    PENDING: 'PENDING',
    DELETED: 'DELETED'
};

export const UserStateLabels = {
    [UserState.ACTIVE]: 'Hoạt động',
    [UserState.INACTIVE]: 'Không hoạt động',
    [UserState.PENDING]: 'Chờ kích hoạt',
    [UserState.DELETED]: 'Đã xóa'
};

export const UserStateColors = {
    [UserState.ACTIVE]: 'green',
    [UserState.INACTIVE]: 'orange',
    [UserState.PENDING]: 'blue',
    [UserState.DELETED]: 'red'
};

// Helper function to get status options for dropdowns
export const getSiteStatusOptions = () => {
    return Object.values(SiteStatus).map(status => ({
        value: status,
        label: SiteStatusLabels[status]
    }));
};

export const getLeaseLineStatusOptions = () => {
    return Object.values(LeaseLineStatus).map(status => ({
        value: status,
        label: LeaseLineStatusLabels[status]
    }));
};

export const getDeviceStatusOptions = () => {
    return Object.values(DeviceStatus).map(status => ({
        value: status,
        label: DeviceStatusLabels[status]
    }));
};

export const getFoLineStatusOptions = () => {
    return Object.values(FoLineStatus).map(status => ({
        value: status,
        label: FoLineStatusLabels[status]
    }));
};

export const getUserStateOptions = () => {
    return Object.values(UserState).map(state => ({
        value: state,
        label: UserStateLabels[state]
    }));
};
