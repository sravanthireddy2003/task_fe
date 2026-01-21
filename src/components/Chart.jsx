import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartData } from "../assets/data";

export const Chart = ({ data = chartData, dataKey = 'total', height = 300 }) => {
  return (
    <ResponsiveContainer width={"100%"} height={height}>
      <BarChart width={150} height={40} data={data}>
        <XAxis dataKey='name' />
        <YAxis />
        <Tooltip />
        <Legend />
        <CartesianGrid strokeDasharray='3 3' />
        <Bar dataKey={dataKey} fill='#3b82f6' />
      </BarChart>
    </ResponsiveContainer>
  );
};
