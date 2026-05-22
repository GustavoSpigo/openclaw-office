import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import i18n from "@/i18n/test-setup";
import { LanguageSwitcher } from "../LanguageSwitcher";

describe("LanguageSwitcher", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("zh");
    });
  });

  it("shows 中文 when current language is zh", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText("中文")).toBeInTheDocument();
  });

  it("shows EN when current language is en", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    render(<LanguageSwitcher />);
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it("shows PT-BR when current language is pt-BR", async () => {
    await act(async () => {
      await i18n.changeLanguage("pt-BR");
    });
    render(<LanguageSwitcher />);
    expect(screen.getByText("PT-BR")).toBeInTheDocument();
  });

  it("switches to en on click when current is zh", async () => {
    render(<LanguageSwitcher />);
    await act(async () => {
      fireEvent.click(screen.getByText("中文"));
    });
    expect(i18n.language).toBe("en");
  });

  it("switches to pt-BR on click when current is en", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    render(<LanguageSwitcher />);
    await act(async () => {
      fireEvent.click(screen.getByText("EN"));
    });
    expect(i18n.language).toBe("pt-BR");
  });

  it("switches to zh on click when current is pt-BR", async () => {
    await act(async () => {
      await i18n.changeLanguage("pt-BR");
    });
    render(<LanguageSwitcher />);
    await act(async () => {
      fireEvent.click(screen.getByText("PT-BR"));
    });
    expect(i18n.language).toBe("zh");
  });

  it("has correct aria-label in zh", () => {
    render(<LanguageSwitcher />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toBe("切换到英文");
  });

  it("has correct aria-label in en", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    render(<LanguageSwitcher />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toBe("Switch to Portuguese (Brazil)");
  });

  it("has correct aria-label in pt-BR", async () => {
    await act(async () => {
      await i18n.changeLanguage("pt-BR");
    });
    render(<LanguageSwitcher />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toBe("Alternar para chinês");
  });
});
