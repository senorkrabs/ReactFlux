import { Button, Notification, Popconfirm, Radio } from "@arco-design/web-react"
import {
  IconAlignLeft,
  IconCheck,
  IconRecord,
  IconRefresh,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect } from "react"

import { getCounters } from "@/apis"
import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setEntries } from "@/store/contentState"
import { dataState, setUnreadInfo, setUnreadTodayCount } from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import "./FooterPanel.css"

const updateAllEntriesAsRead = () => {
  setEntries((prev) => prev.map((entry) => ({ ...entry, status: "read" })))
}

const FooterPanel = ({ info, refreshArticleList, markAllAsRead }) => {
  const { isArticleListReady } = useStore(contentState)
  const { feedsData } = useStore(dataState)
  const { showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      updateAllEntriesAsRead()

      if (info.from === "all") {
        setUnreadInfo({})
      } else if (info.from === "today") {
        const countersData = await getCounters()
        const unreadInfo = feedsData.reduce((acc, feed) => {
          acc[feed.id] = countersData.unreads[feed.id] ?? 0
          return acc
        }, {})

        setUnreadInfo(unreadInfo)
        setUnreadTodayCount(0)
      } else if (info.from === "feed") {
        setUnreadInfo((prev) => ({ ...prev, [info.id]: 0 }))
      } else if (info.from === "category") {
        const feedIds = feedsData
          .filter((feed) => feed.category.id === Number(info.id))
          .map((feed) => feed.id)

        setUnreadInfo((prev) => ({
          ...prev,
          ...feedIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
        }))
      }

      Notification.success({
        title: polyglot.t("article_list.mark_all_as_read_success"),
      })
    } catch (error) {
      console.error("Failed to mark all as read: ", error)
      Notification.error({
        title: polyglot.t("article_list.mark_all_as_read_error"),
        content: error.message,
      })
    }
  }

  const handleFilterChange = (value) => {
    updateSettings({ showStatus: value })
  }

  const baseFilterOptions = [
    {
      label: polyglot.t("article_list.filter_status_unread"),
      value: "unread",
      icon: <IconRecord />,
    },
    {
      label: polyglot.t("article_list.filter_status_all"),
      value: "all",
      icon: <IconAlignLeft />,
    },
  ]

  const starredOption = {
    label: polyglot.t("article_list.filter_status_starred"),
    value: "starred",
    icon: <IconStarFill />,
  }

  const filterOptions = ["category", "feed"].includes(info.from)
    ? [starredOption, ...baseFilterOptions]
    : baseFilterOptions

  const renderRadioButton = (option) => {
    const isSelected = showStatus === option.value
    return (
      <Radio value={option.value}>
        {option.icon}
        {isSelected && <span style={{ marginLeft: "4px" }}>{option.label}</span>}
      </Radio>
    )
  }

  useEffect(() => {
    if (info.from === "starred" && showStatus !== "unread") {
      updateSettings({ showStatus: "all" })
    }
  }, [info.from, showStatus])

  return (
    <div className="entry-panel">
      <Popconfirm
        focusLock
        title={polyglot.t("article_list.mark_all_as_read_confirm")}
        onOk={handleMarkAllAsRead}
      >
        <CustomTooltip mini content={polyglot.t("article_list.mark_all_as_read_tooltip")}>
          <Button
            icon={<IconCheck />}
            shape="circle"
            style={{
              visibility: ["starred", "history"].includes(info.from) ? "hidden" : "visible",
            }}
          />
        </CustomTooltip>
      </Popconfirm>
      <Radio.Group
        style={{ visibility: info.from === "history" ? "hidden" : "visible" }}
        type="button"
        value={showStatus}
        onChange={handleFilterChange}
      >
        {filterOptions.map((option) => renderRadioButton(option))}
      </Radio.Group>
      <CustomTooltip mini content={polyglot.t("article_list.refresh_tooltip")}>
        <Button
          icon={<IconRefresh />}
          loading={!isArticleListReady}
          shape="circle"
          onClick={refreshArticleList}
        />
      </CustomTooltip>
    </div>
  )
}

export default FooterPanel
