import {
  NavLink,
} from "react-router-dom";


export default function BottomNav() {

  return (

    <nav className="bottom-nav">

      {/* OVERVIEW */}

      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `bottom-nav-item ${
            isActive
              ? "active"
              : ""
          }`
        }
      >

        <span className="bottom-nav-icon">

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >

            <path
              d="
                M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z
              "
            />

          </svg>

        </span>


        <span>
          Overview
        </span>

      </NavLink>



      {/* TRANSACTIONS */}

      <NavLink
        to="/transactions"
        className={({ isActive }) =>
          `bottom-nav-item ${
            isActive
              ? "active"
              : ""
          }`
        }
      >

        <span className="bottom-nav-icon">

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >

            <path
              d="
                M5 4h14v16H5V4Zm3 4h8M8 12h8M8 16h5
              "
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />

          </svg>

        </span>


        <span>
          Transactions
        </span>

      </NavLink>



      {/* VISUALIZER */}

      <NavLink
        to="/visualizer"
        className={({ isActive }) =>
          `bottom-nav-item ${
            isActive
              ? "active"
              : ""
          }`
        }
      >

        <span className="bottom-nav-icon">

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >

            <rect
              x="3"
              y="6"
              width="18"
              height="12"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />

            <circle
              cx="12"
              cy="12"
              r="2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />

            <path
              d="
                M7 9h.01
                M17 15h.01
              "
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

          </svg>

        </span>


        <span>
          Visualizer
        </span>

      </NavLink>



      {/* NOTES */}

      <NavLink
        to="/notes"
        className={({ isActive }) =>
          `bottom-nav-item ${
            isActive
              ? "active"
              : ""
          }`
        }
      >

        <span className="bottom-nav-icon">

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >

            <path
              d="
                M6 3h9l3 3v15H6V3Z
              "
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            <path
              d="
                M9 10h6
                M9 14h6
                M9 18h4
              "
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />

          </svg>

        </span>


        <span>
          Notes
        </span>

      </NavLink>

    </nav>

  );
}