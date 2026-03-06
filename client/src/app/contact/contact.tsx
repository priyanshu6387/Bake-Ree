"use client";

import { useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { FaGlobe } from "react-icons/fa6";

export default function ContactForm() {
  const [phone, setPhone] = useState("");

  return (
    <div className="relative w-full">
      {/* Layered BG (top half light, bottom half dark) */}
      <div className="absolute inset-0 z-0">
        <div className="h-[25%] bg-[#f3f2ec]" />
        <div className="h-[75%] bg-[#172b27]" />
      </div>

      {/* Centered Contact Form */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-15">
        <div className="bg-[#afa5f7] rounded-[3rem] px-8 md:px-14 py-16">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Heading */}
            <div className="text-[#2a2927]">
              <h2 className="text-5xl md:text-6xl font-light leading-tight">
                Get
                <br />
                in Touch
              </h2>
              <p className="mt-4 max-w-sm text-[#2a2927] text-base">
                Whether you’re ordering custom pastries or want to ask us
                something sweet, we’d love to hear from you!
              </p>
            </div>

            {/* Right Form */}
            <form className="space-y-6 text-[#2a2927]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    First name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border-b border-[#2a2927] bg-transparent focus:outline-none py-1"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Last name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border-b border-[#2a2927] bg-transparent focus:outline-none py-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full border-b border-[#2a2927] bg-transparent focus:outline-none py-1"
                  />
                </div>

                {/* Phone Input */}

                <div className="relative w-full mt-5">
                  {/* Custom Globe Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      const dropdown = document.querySelector(
                        ".react-tel-input .flag-dropdown"
                      ) as HTMLElement;
                      if (dropdown) dropdown.click();
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 px-2 h-full flex items-center"
                  >
                    <FaGlobe className="text-[#2a2927] bg-[#afa5f7] text-md" />
                  </button>

                  {/* Phone Input */}
                  <PhoneInput
                    country={""}
                    value={phone}
                    onChange={setPhone}
                    enableSearch
                    disableCountryGuess={false}
                    disableDropdown={false}
                    inputStyle={{
                      width: "100%",
                      border: "none",
                      borderBottom: "1px solid #2a2927",
                      backgroundColor: "transparent",
                      paddingLeft: "42px",
                      fontSize: "14px",
                      color: "#2a2927",
                      height: "32px",
                    }}
                    buttonStyle={{
                      backgroundColor: "transparent",
                      border: "none",
                      boxShadow: "none",
                      margin: 0,
                    }}
                    containerStyle={{
                      width: "100%",
                      background: "transparent",
                    }}
                    dropdownStyle={{
                      backgroundColor: "#2a2927",
                      color: "#2a2927",
                      border: "1px solid #2a2927",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Bakery / Organization
                </label>
                <input
                  type="text"
                  className="w-full border-b border-[#2a2927] bg-transparent focus:outline-none py-1"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  How can we help?
                </label>
                <textarea
                  className="w-full border-b border-[#2a2927] bg-transparent focus:outline-none py-1"
                  rows={3}
                ></textarea>
              </div>

              <div>
                <button
                  type="submit"
                  className="bg-[#2a2927] text-white rounded-full px-8 py-3 hover:bg-white hover:text-black hover:border hover:border-[#2a2927] transition-all duration-200"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
