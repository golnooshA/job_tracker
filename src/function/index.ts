const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
admin.initializeApp();

// Optional: limit region / concurrency
setGlobalOptions({ region: "us-central1" });

exports.notifyNewJob = onDocumentCreated("jobs/{jobId}", async (event) => {
  const job = event.data?.data() || {};
  const role = job.role || "New job";
  // If you want company name here, store it denormalized on job doc (e.g., job.companyName)
  const company = job.companyName || "";

  await admin.messaging().send({
    topic: "new-jobs",
    notification: {
      title: "New job posted",
      body: company ? `${role} at ${company}` : role,
    },
    data: {
      jobId: String(job.id || event.params.jobId),
    },
  });
});
