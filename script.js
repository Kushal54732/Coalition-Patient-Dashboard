
console.log("Tech.Care Dashboard started!");

const API_URL = "https://fedskillstest.coalitiontechnologies.workers.dev";

let bloodPressureChart = null;


// Safely display API text in HTML
function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// Get a usable value from possible API field names
function getValue(object, keys) {
    for (const key of keys) {
        if (object && object[key] !== undefined && object[key] !== null && object[key] !== "") {
            return object[key];
        }
    }
    return null;
}


// Format date when the API provides a valid date
function formatDate(value) {
    if (!value) return "Not provided";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}


// Load patient information from API
async function getPatientData() {

    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Authorization": "Basic " + btoa("coalition:skills-test")
            }
        });

        if (!response.ok) {
            throw new Error("API request failed: " + response.status);
        }

        const patients = await response.json();

        const jessica = patients.find(
            patient => patient.name === "Jessica Taylor"
        );

        if (!jessica) {
            throw new Error("Jessica Taylor was not found in the API response.");
        }

        console.log("Jessica Taylor API data:", jessica);

        displayPatientSidebar(jessica);
        displayPatientProfile(jessica);
        displayBloodPressureChart(jessica);
        displayVitalCards(jessica);
        displayDiagnosticList(jessica);
        displayLabResults(jessica);

    } catch (error) {
        console.error("Dashboard error:", error);

        document.getElementById("patient-list").innerHTML =
            '<p class="loading">Unable to load patient data. Please refresh the page.</p>';

        document.getElementById("profile-details").textContent =
            "Patient information could not be loaded.";

        document.getElementById("lab-results").textContent =
            "Lab results could not be loaded.";
    }
}


// Display Jessica in the sidebar
function displayPatientSidebar(patient) {

    const container = document.getElementById("patient-list");

    const picture = getValue(patient, ["profile_picture", "profilePicture"]);
    const gender = getValue(patient, ["gender"]) || "Not provided";
    const age = getValue(patient, ["age"]) || "Not provided";

    const avatar = picture
        ? `<img src="${escapeHTML(picture)}" alt="Jessica Taylor">`
        : '<div class="patient-initials">JT</div>';

    container.innerHTML = `
        <div class="patient-entry">
            ${avatar}
            <div>
                <strong>${escapeHTML(patient.name)}</strong>
                <small>${escapeHTML(gender)}, ${escapeHTML(age)}</small>
            </div>
        </div>
    `;
}


// Display patient profile information
function displayPatientProfile(patient) {

    const name = getValue(patient, ["name"]) || "Jessica Taylor";

    document.getElementById("profile-name").textContent = name;

    const picture = getValue(patient, ["profile_picture", "profilePicture"]);

    const avatar = document.getElementById("profile-avatar");

    if (picture) {
        avatar.innerHTML = `<img src="${escapeHTML(picture)}" alt="${escapeHTML(name)}">`;
    } else {
        avatar.textContent = "JT";
    }

    const details = [
        {
            icon: "▣",
            label: "Date of Birth",
            value: formatDate(getValue(patient, ["date_of_birth", "dateOfBirth", "dob"]))
        },
        {
            icon: "♀",
            label: "Gender",
            value: getValue(patient, ["gender"]) || "Not provided"
        },
        {
            icon: "☎",
            label: "Contact",
            value: getValue(patient, ["phone_number", "phone", "phoneNumber"]) || "Not provided"
        },
        {
            icon: "✉",
            label: "Email",
            value: getValue(patient, ["email"]) || "Not provided"
        },
        {
            icon: "♡",
            label: "Emergency Contact",
            value: getValue(patient, ["emergency_contact", "emergencyContact"]) || "Not provided"
        },
        {
            icon: "✚",
            label: "Insurance",
            value: getValue(patient, ["insurance_type", "insurance", "insuranceType"]) || "Not provided"
        }
    ];

    document.getElementById("profile-details").innerHTML =
        details.map(item => `
            <div class="detail-row">
                <span class="detail-icon">${item.icon}</span>
                <div>
                    <small>${item.label}</small>
                    <strong>${escapeHTML(item.value)}</strong>
                </div>
            </div>
        `).join("");
}


// Display blood pressure history chart
function displayBloodPressureChart(patient) {

    const history = patient.diagnosis_history || [];

    const canvas = document.getElementById("bloodPressureChart");

    if (!canvas || typeof Chart === "undefined") {
        console.error("Chart.js or chart canvas is unavailable.");
        return;
    }

    if (!history.length) {
        console.error("No blood pressure history available.");
        return;
    }

    // Display the latest six readings in chronological order
    const records = [...history].reverse().slice(-6);

    const labels = records.map(item =>
        `${item.month} ${item.year}`
    );

    const systolic = records.map(item =>
        item.blood_pressure?.systolic?.value ?? null
    );

    const diastolic = records.map(item =>
        item.blood_pressure?.diastolic?.value ?? null
    );

    if (bloodPressureChart) {
        bloodPressureChart.destroy();
    }

    bloodPressureChart = new Chart(canvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [
                {
                    label: "Systolic",
                    data: systolic,
                    borderColor: "#df71c8",
                    backgroundColor: "rgba(223,113,200,0.13)",
                    pointBackgroundColor: "#df71c8",
                    pointRadius: 4,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: "Diastolic",
                    data: diastolic,
                    borderColor: "#8066d9",
                    backgroundColor: "rgba(128,102,217,0.08)",
                    pointBackgroundColor: "#8066d9",
                    pointRadius: 4,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: "#183c45",
                    padding: 12
                }
            },

            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: "rgba(100,110,140,0.10)"
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}


// Display latest vital measurements
function displayVitalCards(patient) {

    const history = patient.diagnosis_history || [];

    if (!history.length) {
        return;
    }

    const latest = history[0];

    const respiratory = latest.respiratory_rate || {};
    const temperature = latest.temperature || {};
    const heart = latest.heart_rate || {};

    document.getElementById("respiratory-rate").textContent =
        respiratory.value ?? "--";

    document.getElementById("temperature").textContent =
        temperature.value ?? "--";

    document.getElementById("heart-rate").textContent =
        heart.value ?? "--";

    document.getElementById("respiratory-level").textContent =
        respiratory.levels || "Latest reading";

    document.getElementById("temperature-level").textContent =
        temperature.levels || "Latest reading";

    document.getElementById("heart-level").textContent =
        heart.levels || "Latest reading";
}


// Display diagnostic list
function displayDiagnosticList(patient) {

    const container = document.getElementById("diagnostic-list");

    const diagnoses = patient.diagnostic_list || [];

    document.getElementById("diagnosis-count").textContent =
        `${diagnoses.length} records`;

    if (!diagnoses.length) {
        container.innerHTML =
            '<tr><td colspan="3">No diagnostic records available.</td></tr>';
        return;
    }

    container.innerHTML = diagnoses.map(item => {

        const status = item.status || "Not provided";

        let statusClass = "";

        if (status.toLowerCase().includes("observation")) {
            statusClass = "observation";
        } else if (
            status.toLowerCase().includes("inactive") ||
            status.toLowerCase().includes("cured")
        ) {
            statusClass = "inactive";
        }

        return `
            <tr>
                <td>${escapeHTML(item.name)}</td>
                <td>${escapeHTML(item.description)}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${escapeHTML(status)}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}


// Display laboratory results
function displayLabResults(patient) {

    const container = document.getElementById("lab-results");

    const results = patient.lab_results || [];

    if (!results.length) {
        container.innerHTML =
            '<p class="loading">No laboratory results available.</p>';
        return;
    }

    container.innerHTML = results.map(result => {

        const resultName =
            typeof result === "string"
                ? result
                : getValue(result, ["name", "test_name", "testName", "title"]);

        if (!resultName) {
            return "";
        }

        return `
            <div class="lab-item">
                <span>${escapeHTML(resultName)}</span>
                <span class="lab-download" aria-hidden="true">↓</span>
            </div>
        `;
    }).join("");
}


// Start dashboard
getPatientData();
