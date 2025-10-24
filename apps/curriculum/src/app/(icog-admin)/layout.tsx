import Sidebar from "@/components/ui/sidebar";
import Topbar from "@/components/ui/topbar";

const adminNavItems = [
  {
    icon: <img src="/home.svg" alt="icon" width={19} height={19} />,
    href: "/dashboard",
    label: "Dashboard",
  },

  {
    icon: <img src="/profile.svg" alt="icon" width={19} height={19} />,
    href: "/users",
    label: "Users",
  },
  {
    icon: (
      <img src="/trainingM.svg" alt="icon" width={19} height={19} />
    ),
    href: "/trainings",
    label: "Trainings",
  },
  {
    icon: (
      <img src="/training.svg" alt="icon" width={19} height={19} />
    ),
    href: "/basedata",
    label: "Base Data",
  },
  // {
  //   icon: <img src="/settings.svg" alt="icon" width={19} height={19} />,
  //   href: "/settings",
  //   label: "Settings",
  // },
];

export default function ICOGAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Sidebar navItems={adminNavItems} />
      <Topbar />
      {children}
    </div>
  );
}
