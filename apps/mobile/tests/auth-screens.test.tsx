// CHORD-103: Mobile auth screen tests
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { LoginScreen } from "../../src/auth/LoginScreen";
import { RegisterScreen } from "../../src/auth/RegisterScreen";
import { mockNavigation } from "../screen-test-setup";

jest.mock("../../src/auth/auth-api", () => ({
  apiLogin: jest.fn(),
  apiRegister: jest.fn()
}));

jest.mock("../../src/auth/persisted-auth", () => ({
  saveAuthSession: jest.fn()
}));

jest.mock("../../src/analytics/analytics", () => ({
  track: jest.fn(),
  AnalyticsEvent: {
    BUTTON_PRESS: "BUTTON_PRESS",
    SESSION_START: "SESSION_START",
    ERROR: "ERROR"
  }
}));

jest.mock("../../src/config", () => ({
  getMobileConfig: () => ({ apiUrl: "http://localhost:4000" })
}));

const { apiLogin, apiRegister } = jest.requireMock("../../src/auth/auth-api") as {
  apiLogin: jest.Mock;
  apiRegister: jest.Mock;
};

const { saveAuthSession } = jest.requireMock("../../src/auth/persisted-auth") as {
  saveAuthSession: jest.Mock;
};

const mockUser = { id: "u1", email: "fan@example.com", username: "fan_one", role: "fan" };
const mockResult = { token: "tok", user: mockUser, sessionId: "sess-1" };

describe("LoginScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders email and password fields", () => {
    const { getByLabelText } = render(
      <LoginScreen navigation={mockNavigation as never} />
    );
    expect(getByLabelText("Email")).toBeTruthy();
    expect(getByLabelText("Password")).toBeTruthy();
  });

  it("shows validation error when fields are empty", async () => {
    const { getByLabelText: getByA11y, getByText } = render(
      <LoginScreen navigation={mockNavigation as never} />
    );
    fireEvent.press(getByA11y("Sign in"));
    await waitFor(() => {
      expect(getByText("Email and password are required.")).toBeTruthy();
    });
  });

  it("calls apiLogin and saves session on success", async () => {
    apiLogin.mockResolvedValueOnce(mockResult);
    const { getByLabelText } = render(
      <LoginScreen navigation={mockNavigation as never} />
    );
    fireEvent.changeText(getByLabelText("Email"), "fan@example.com");
    fireEvent.changeText(getByLabelText("Password"), "password123");
    fireEvent.press(getByLabelText("Sign in"));

    await waitFor(() => {
      expect(apiLogin).toHaveBeenCalledWith("fan@example.com", "password123");
      expect(saveAuthSession).toHaveBeenCalledWith("tok", "sess-1");
    });
  });

  it("shows error message on login failure", async () => {
    apiLogin.mockRejectedValueOnce(new Error("Invalid email or password"));
    const { getByLabelText, getByText } = render(
      <LoginScreen navigation={mockNavigation as never} />
    );
    fireEvent.changeText(getByLabelText("Email"), "bad@example.com");
    fireEvent.changeText(getByLabelText("Password"), "wrongpass");
    fireEvent.press(getByLabelText("Sign in"));

    await waitFor(() => {
      expect(getByText("Invalid email or password")).toBeTruthy();
    });
  });
});

describe("RegisterScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders all fields", () => {
    const { getByLabelText } = render(
      <RegisterScreen navigation={mockNavigation as never} />
    );
    expect(getByLabelText("Email")).toBeTruthy();
    expect(getByLabelText("Username")).toBeTruthy();
    expect(getByLabelText("Password")).toBeTruthy();
  });

  it("shows validation error for short password", async () => {
    const { getByLabelText, getByText } = render(
      <RegisterScreen navigation={mockNavigation as never} />
    );
    fireEvent.changeText(getByLabelText("Email"), "fan@example.com");
    fireEvent.changeText(getByLabelText("Username"), "fan_one");
    fireEvent.changeText(getByLabelText("Password"), "short");
    fireEvent.press(getByLabelText("Create account"));

    await waitFor(() => {
      expect(getByText("Password must be at least 8 characters.")).toBeTruthy();
    });
  });

  it("calls apiRegister and saves session on success", async () => {
    apiRegister.mockResolvedValueOnce(mockResult);
    const { getByLabelText } = render(
      <RegisterScreen navigation={mockNavigation as never} />
    );
    fireEvent.changeText(getByLabelText("Email"), "fan@example.com");
    fireEvent.changeText(getByLabelText("Username"), "fan_one");
    fireEvent.changeText(getByLabelText("Password"), "password123");
    fireEvent.press(getByLabelText("Create account"));

    await waitFor(() => {
      expect(apiRegister).toHaveBeenCalledWith("fan@example.com", "fan_one", "password123");
      expect(saveAuthSession).toHaveBeenCalledWith("tok", "sess-1");
    });
  });
});
