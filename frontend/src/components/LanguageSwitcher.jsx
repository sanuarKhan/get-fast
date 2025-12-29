import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = ({ variant = "default" }) => {
  const { i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "bn", name: "বাংলা", flag: "🇧🇩" },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setShowMenu(false);
  };

  // Icon variant - for navbar/header
  if (variant === "icon") {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Change Language"
        >
          <span className="text-xl">{currentLanguage.flag}</span>
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            ></div>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center ${
                    i18n.language === lang.code ? "bg-blue-50" : ""
                  }`}
                >
                  <span className="text-xl mr-3">{lang.flag}</span>
                  <span
                    className={`text-sm ${
                      i18n.language === lang.code
                        ? "font-semibold text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    {lang.name}
                  </span>
                  {i18n.language === lang.code && (
                    <svg
                      className="w-5 h-5 ml-auto text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Toggle variant - for settings page
  if (variant === "toggle") {
    return (
      <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`flex items-center px-4 py-2 rounded-md transition-all ${
              i18n.language === lang.code
                ? "bg-white shadow text-blue-600 font-semibold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="mr-2">{lang.flag}</span>
            <span className="text-sm">{lang.name}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default variant - dropdown button
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-xl mr-2">{currentLanguage.flag}</span>
        <span className="text-sm font-medium text-gray-700">
          {currentLanguage.name}
        </span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${
            showMenu ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center border-b last:border-b-0 ${
                  i18n.language === lang.code ? "bg-blue-50" : ""
                }`}
              >
                <span className="text-xl mr-3">{lang.flag}</span>
                <span
                  className={`text-sm ${
                    i18n.language === lang.code
                      ? "font-semibold text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  {lang.name}
                </span>
                {i18n.language === lang.code && (
                  <svg
                    className="w-5 h-5 ml-auto text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
