import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
// Import getISOWeek for formal Monday-Sunday tracking
import { getISOWeek } from 'date-fns'; 
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/donations')
      .then(res => {
        setDonations(res.data);
        setLoading(false);
      })
      .catch(err => console.error("Frontend Fetch Error:", err));
  }, []);

  if (loading) return <div style={{backgroundColor: '#0f172a', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading Amanah Data...</div>;

  // PROCESS DATA FOR CHARTS AND MATRIX
  const weeklyTotals = {};
  const donorMatrix = {};
  const allWeeks = new Set();

  donations.forEach(d => {
    const date = new Date(d.timestamp);
    
    // getISOWeek explicitly starts the week on Monday
    const weekNumber = getISOWeek(date);
    const weekLabel = `Week ${weekNumber}`;
    allWeeks.add(weekLabel);

    // Total for Bar Chart
    weeklyTotals[weekLabel] = (weeklyTotals[weekLabel] || 0) + d.amount;

    // Data for Matrix
    if (!donorMatrix[d.email]) donorMatrix[d.email] = {};
    donorMatrix[d.email][weekLabel] = "XX";
  });
// Calculate total revenue for the summary line
const totalRevenue = donations.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
  // Sort weeks numerically so "Week 2" comes before "Week 10"
  const sortedWeeks = Array.from(allWeeks).sort((a, b) => {
    return parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]);
  });

  const chartData = {
    labels: sortedWeeks,
    datasets: [{
      label: 'Weekly Revenue (INR)',
      data: sortedWeeks.map(w => weeklyTotals[w]),
      backgroundColor: '#10b981', // Emerald
      borderRadius: 6,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#f1f5f9', font: { family: 'Inter' } } },
      tooltip: { backgroundColor: '#1e293b', titleColor: '#10b981', bodyColor: '#f1f5f9' }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
    }
  };

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f1f5f9', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '10px' }}>Amanah Network Dashboard</h1>
      <p style={{ color: '#94a3b8', marginBottom: '40px' }}>Formal Tracking: Monday – Sunday</p>
      
      {/* SECTION 1: BAR CHART */}
      <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', marginBottom: '40px', border: '1px solid #334155' }}>
        <h3 style={{ marginTop: 0, color: '#10b981' }}>Weekly Performance</h3>
        <Bar data={chartData} options={chartOptions} />
      </div>
    {/* NEW REVENUE SUMMARY BOX */}
<div style={{ 
  padding: '20px', 
  backgroundColor: '#1e293b', 
  borderRadius: '12px', 
  marginBottom: '40px',
  borderLeft: '4px solid #10b981' 
}}>
  <h3 style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>TOTAL NETWORK REVENUE</h3>
  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
    ₹{totalRevenue.toLocaleString()}
  </div>
</div>
      {/* SECTION 2: DONOR MATRIX */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Individual Tracking</h2>
        <span style={{ backgroundColor: '#064e3b', color: '#34d399', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>
          Active Records
        </span>
      </div>
      
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #334155' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#1e293b' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155', backgroundColor: '#0f172a' }}>
              <th style={{ padding: '15px', textAlign: 'left' }}>Donor Email</th>
              {sortedWeeks.map(w => <th key={w} style={{ padding: '15px' }}>{w}</th>)}
            </tr>
          </thead>
          <tbody>
            {Object.keys(donorMatrix).map(email => (
              <tr key={email} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>{email}</td>
                {sortedWeeks.map(w => (
                  <td key={w} style={{ 
                    textAlign: 'center', 
                    padding: '15px',
                    color: donorMatrix[email][w] === "XX" ? "#10b981" : "#475569" 
                  }}>
                    {donorMatrix[email][w] === "XX" ? "●" : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;