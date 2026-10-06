// rotompc-client/src/components/profile/TrainerAvatar.jsx

import { useCallback, useEffect, useState } from "react";

import {
  fetchMyTrainerAvatar,
  fetchTrainerAvatar,
} from "@/services/TrainerAvatarService";

/* =========================================================
   COMPONENT
========================================================= */

const TrainerAvatar = ({
  userId = "",

  mine = false,

  username = "",

  className = "",

  imageClassName = "",

  fallbackClassName = "",

  refreshKey = 0,

  showCredit = false,
}) => {
  const [avatar, setAvatar] = useState(null);

  const [loading, setLoading] = useState(true);

  const [imageFailed, setImageFailed] = useState(false);

  /* =======================================================
     LOAD
  ======================================================= */

  const loadAvatar = useCallback(async () => {
    if (!mine && !userId) {
      setAvatar(null);

      setImageFailed(false);

      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      setImageFailed(false);

      const response = mine
        ? await fetchMyTrainerAvatar()
        : await fetchTrainerAvatar(userId);

      setAvatar(response.data?.avatar || null);
    } catch (error) {
      console.error("Trainer avatar loading error:", error);

      setAvatar(null);
    } finally {
      setLoading(false);
    }
  }, [mine, userId]);

  /* =======================================================
     INITIAL / REFRESH
  ======================================================= */

  useEffect(() => {
    loadAvatar();
  }, [loadAvatar, refreshKey]);

  /* =======================================================
     RESET FAILED IMAGE
  ======================================================= */

  useEffect(() => {
    setImageFailed(false);
  }, [avatar?.imageUrl]);

  /* =======================================================
     GLOBAL AVATAR UPDATE
  ======================================================= */

  useEffect(() => {
    const handleUpdate = (event) => {
      const changedUserId = String(event.detail?.userId || "");

      const nextAvatar = event.detail?.avatar;

      const currentUserId = String(localStorage.getItem("id") || "");

      const belongsToMe =
        mine &&
        (!changedUserId || !currentUserId || changedUserId === currentUserId);

      const belongsToUser =
        !mine && changedUserId && String(userId) === changedUserId;

      if (!belongsToMe && !belongsToUser) {
        return;
      }

      if (Object.prototype.hasOwnProperty.call(event.detail || {}, "avatar")) {
        setAvatar(nextAvatar || null);

        setImageFailed(false);

        setLoading(false);

        return;
      }

      loadAvatar();
    };

    window.addEventListener(
      "trainer-avatar-update",

      handleUpdate,
    );

    return () => {
      window.removeEventListener(
        "trainer-avatar-update",

        handleUpdate,
      );
    };
  }, [loadAvatar, mine, userId]);

  /* =======================================================
     FALLBACK
  ======================================================= */

  const initial = String(username || "T")
    .charAt(0)
    .toUpperCase();

  const hasAvatar = Boolean(avatar?.imageUrl) && !imageFailed;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className={`
        relative

        overflow-hidden

        ${className}
      `}
    >
      {loading ? (
        <div
          className="
            flex
            h-full
            w-full
            items-center
            justify-center
          "
        >
          <div
            className="
              h-5
              w-5

              animate-spin

              rounded-full

              border-2
              border-white/30
              border-t-white
            "
          />
        </div>
      ) : hasAvatar ? (
        <>
          <img
            src={avatar.imageUrl}
            alt={`${username || "Trainer"} avatar`}
            draggable={false}
            onError={() => setImageFailed(true)}
            className={`
              h-full
              w-full

              object-contain
              object-bottom

              ${imageClassName}
            `}
            style={{
              imageRendering: "pixelated",
            }}
          />

          {showCredit && avatar.credit && (
            <span
              className="
                  absolute
                  bottom-1
                  right-1

                  rounded

                  bg-black/70

                  px-1.5
                  py-0.5

                  text-[6px]
                  font-bold

                  text-white/80
                "
            >
              {avatar.credit}
            </span>
          )}
        </>
      ) : (
        <div
          className={`
            flex
            h-full
            w-full
            items-center
            justify-center

            font-black
            uppercase

            ${fallbackClassName}
          `}
        >
          {initial}
        </div>
      )}
    </div>
  );
};

export default TrainerAvatar;
