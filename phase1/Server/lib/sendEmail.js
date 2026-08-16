const sendEmail = async({ email, subject, text }) => {
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("Email sent successfully");
            resolve();
        }, 6000);
    });
    console.log("Task completed");
};

export default sendEmail;