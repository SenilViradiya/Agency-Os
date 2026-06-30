'use client';

import React from 'react';
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface DateRangeFilterProps {
  onChange: (dates: [Dayjs, Dayjs]) => void;
  defaultValue?: [Dayjs, Dayjs];
}

const presets = [
  { label: 'Last 7 Days', value: [dayjs().subtract(7, 'day'), dayjs()] as [Dayjs, Dayjs] },
  { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] as [Dayjs, Dayjs] },
  { label: 'Last 90 Days', value: [dayjs().subtract(90, 'day'), dayjs()] as [Dayjs, Dayjs] },
  { label: 'This Month', value: [dayjs().startOf('month'), dayjs()] as [Dayjs, Dayjs] },
  {
    label: 'Last Month',
    value: [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ] as [Dayjs, Dayjs],
  },
];

export default function DateRangeFilter({ onChange, defaultValue }: DateRangeFilterProps) {
  return (
    <RangePicker
      presets={presets}
      defaultValue={defaultValue || [dayjs().subtract(30, 'day'), dayjs()]}
      onChange={(dates) => {
        if (dates && dates[0] && dates[1]) {
          onChange([dates[0], dates[1]]);
        }
      }}
      format="DD MMM YYYY"
      style={{ borderRadius: 8 }}
      allowClear={false}
    />
  );
}
