/**
 * Dashboard Logic - Alsafir CRM
 * Powered by ProCoding (Belal Hesham)
 */

document.addEventListener('DOMContentLoaded', function () {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    // تأكد إن البيانات موجودة قبل الرسم
    if (typeof statsData !== 'undefined') {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: statsData.chartLabels,
                datasets: [{
                    label: 'توزيع الحالات',
                    data: statsData.chartData,
                    borderColor: '#c5a059',
                    backgroundColor: 'rgba(197, 160, 89, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: '#c5a059'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#fff', font: { family: 'Cairo' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#fff', font: { family: 'Cairo' } }
                    }
                }
            }
        });
    }
});