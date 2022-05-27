module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFilesAfterEnv: ["./jest.setupAfterEnv.js"],
    setupFiles: ["./jest.setup.js"],
};
