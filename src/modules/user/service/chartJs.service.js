import cloudinary from './../../../utils/multer/cloudinary.js';
import { ArcElement, CategoryScale, Chart, LinearScale, LineController, LineElement, PieController, PointElement } from 'chart.js';
import { createCanvas } from 'canvas';



Chart.register(
    CategoryScale,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
);


export const generateChartsToCloud = async (analyticsData) => {

    const lineChartCanvas = createCanvas(800, 400);
    const ctx = lineChartCanvas.getContext('2d');

    const lineChart = new Chart(ctx, {
        type: 'line',
        data: {
        labels: analyticsData.viewersPerDay.map(day => day.date),
        datasets: [{
            label: 'Views',
            data: analyticsData.viewersPerDay.map(day => day.views),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            tension: 0.1
        }]
        },
        options: {
        responsive: true,
        plugins: {
            title: {
            display: true,
            text: 'Total Views per Day'
            }
        }
        }
    });

    const lineChartBuffer = lineChartCanvas.toBuffer('image/png');


    // Option
    const lineChartUpload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
        { folder: `${process.env.APP_NAME}/user/content/chart`, public_id: `views_per_day_${Date.now()}` },
        (error, result) => {
            if (error) reject(error);
            else resolve(result);
        }
        ).end(lineChartBuffer);
    });

    lineChart.destroy();

    return {
        viewsPerDay: lineChartUpload.secure_url,
    };
};



// Not cloudinary
export const generateCharts = (analyticsData) => {
    return {
        viewsPerDay: {
            labels: analyticsData.viewersPerDay.map(day => day.date),
            datasets: [{
                label: 'Views',
                data: analyticsData.viewersPerDay.map(day => day.views),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                tension: 0.1
            }]
        },
        devices: {
            labels: Object.keys(analyticsData.devices),
            datasets: [{
                data: Object.values(analyticsData.devices),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)'
                ]
            }]
        }
    };
};

export const getLast7DaysViews = (viewers) => {
    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i)); // آخر 7 أيام 
        return {
            date: date.toISOString().split('T')[0],
            views: 0
        };
    });

    viewers.forEach(viewer => {
        const viewDate = new Date(viewer.time).toISOString().split('T')[0];
        const day = days.find(d => d.date === viewDate);
        if (day) day.views++;
    });

    return days;
};