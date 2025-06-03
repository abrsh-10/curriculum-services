"use client";

interface ModuleTabsProps {
  activeTab: string;
  onTabChange: (tab: "information" | "content" | "assessment-method") => void;
}

export function ModuleTabs({ activeTab, onTabChange }: ModuleTabsProps) {
  const tabs = [
    {
      id: "information",
      label: "Module Information",
      src: "/moduleInfo.svg",
      srcActive: "/moduleInfoA.svg",
    },

    {
      id: "assessment-method",
      label: "Assessment Methods",
      src: "/curriculum.svg",
      srcActive: "/curriculum_active.svg",
    },
  ];

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex my-9 min-w-max gap-8 border-b-[0.5px] border-[#CED4DA] mb-6 px-[7%]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as "information" | "content" | "assessment-method")}
            className={`pb-4 text-sm font-medium flex items-center gap-2 relative ${
              activeTab === tab.id
                ? "text-brand border-b-2 border-brand"
                : "text-gray-500"
            }`}
          >
            <img
              src={activeTab === tab.id ? tab.srcActive : tab.src}
              alt=""
              className="w-4 h-4"
            />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
