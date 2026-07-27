export const uploadFile = (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" })
        }
        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        res.status(201).json({ url: fileUrl });
    }
    catch (err) {
        next(err)
    }
}