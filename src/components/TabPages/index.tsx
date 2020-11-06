import React from 'react';
import { history, Location, History, Route, getIntl, getLocale } from 'umi';
import { MenuDataItem, getMenuData, BasicLayoutProps } from '@ant-design/pro-layout';
import { Tabs, Menu, message, Skeleton } from 'antd';
import { SyncOutlined, CloseCircleOutlined } from '@ant-design/icons';
import ContextMenu from '@/components/ContextMenu';
import memoizeOne from 'memoize-one';
import isEqual from 'lodash/isEqual';
import qs from 'qs';
import _ from 'lodash';

const { TabPane } = Tabs;

const { formatMessage } = getIntl(getLocale());

/**
 * 获取路由的Map数据结构（带title）
 * @param route
 */
const getRoutesMap = (routes: any) => {
  const { breadcrumb } = getMenuData(routes || []);
  const breadcrumbMapWithTitle = {};
  if (typeof breadcrumb === 'object') {
    Object.keys(breadcrumb).forEach((key) => {
      breadcrumbMapWithTitle[key] = {
        ...breadcrumb[key],
        title:
          typeof breadcrumb[key].locale === 'string'
            ? formatMessage({ id: breadcrumb[key].locale as string })
            : breadcrumb[key].name,
      };
    });
  }
  return breadcrumbMapWithTitle;
};

const memoizeOneGetRoutesNameMap = memoizeOne(getRoutesMap, isEqual);

export interface TabPagesProps {
  children: React.ReactNode;
  location: Location<{ closed?: boolean }>;
  history: History;
  route: BasicLayoutProps['route'] & {
    authority: string[];
  };
  permissionLoading: boolean;
  /** 默认路由路径 */
  defaultRoute: string;
}

interface ITab {
  /** tab的完整路径，带参数 */
  path: string;
  /** 路由配置的path */
  pathname: string;
  tabName?: string;
  isRefresh?: boolean;
}

export interface TabPagesState {
  tabList: ITab[];
  activeKey: string;
  contextVisible: boolean;
  contextEvent?: any;
  contextMenu?: React.ReactNode;
}

interface IRouteItem extends MenuDataItem {
  redirect?: string;
}

class TabPages extends React.PureComponent<TabPagesProps, TabPagesState> {
  routesNameMap: {
    [path: string]: IRouteItem;
  } = memoizeOneGetRoutesNameMap(this.props.route.routes);

  constructor(props: TabPagesProps) {
    super(props);
    this.state = {
      ...this.getInitTabList(),
      contextVisible: false,
      contextEvent: null,
      contextMenu: '',
    };
  }

  componentDidUpdate(prevProps: TabPagesProps) {
    const { location } = this.props;
    if (location && prevProps.location) {
      const newFullPath = location.pathname + location.search;
      const oldFullPath = prevProps.location.pathname + prevProps.location.search;
      // 关闭指定tab页
      if (location.state && location.state.closed) {
        // 如果新传入来的pathname没变，说明是关闭当前页
        if (newFullPath === oldFullPath) {
          this.onEdit(newFullPath);
        } else {
          this.pushTab(newFullPath, true);
        }
        return;
      }
      if (oldFullPath !== newFullPath) {
        if (history && history.action === 'REPLACE' && oldFullPath !== '/') {
          this.replaceTab();
        } else {
          this.pushTab(newFullPath);
        }
      }
    }
  }

  getInitTabList = () => {
    const {
      location: { pathname },
      defaultRoute,
    } = this.props;
    const tabList: ITab[] = [];
    let activeKey = '';
    const currentRoute = this.routesNameMap[pathname];
    if (currentRoute?.redirect) {
      history.push(currentRoute.redirect);
    } else {
      const defaultRouteItem = this.routesNameMap[defaultRoute];
      activeKey = pathname;
      if (defaultRouteItem) {
        tabList.push({
          path: defaultRouteItem.path!,
          pathname: defaultRouteItem.path!,
        });
      }
      if (defaultRoute !== pathname) {
        tabList.push({
          path: currentRoute.path!,
          pathname: currentRoute.path!,
        });
      }
    }
    return {
      tabList,
      activeKey,
    };
  };

  pushTab = (fullPath: string, closed?: boolean) => {
    const { location } = this.props;
    const { activeKey } = this.state;
    let { tabList } = this.state;
    if (!location) {
      return;
    }
    if (closed) {
      tabList = tabList.filter((item) => item.path !== activeKey);
    }
    const oldIndex = _.findIndex(tabList, { path: fullPath });
    if (oldIndex <= -1) {
      const query = qs.parse(location.search);
      tabList.push({
        pathname: location.pathname,
        path: fullPath,
        tabName: query?.tab as string,
      });
    }
    this.setState({
      tabList,
      activeKey: fullPath,
    });
    history.push(fullPath);
  };

  replaceTab = () => {
    const { location } = this.props;
    if (!location) {
      return;
    }
    const { tabList, activeKey } = this.state;
    const { pathname, search } = location;
    const fullPath = pathname + search;
    const oldIndex = _.findIndex(tabList, { path: fullPath });
    if (oldIndex > -1) {
      const activeIndex = _.findIndex(tabList, { path: activeKey });
      const tempTabs = [...tabList];
      tempTabs.splice(activeIndex, 1);
      this.setState({
        activeKey: fullPath,
        tabList: tempTabs,
      });
    } else {
      const activeTab = _.find(tabList, { key: activeKey }) as ITab;
      const query = qs.parse(search);
      activeTab.pathname = pathname;
      activeTab.path = fullPath;
      activeTab.tabName = query?.tab as string;
      this.setState({
        activeKey: fullPath,
        tabList,
      });
    }
  };

  /** 切换tab页 */
  onChange = (activeKey: string) => {
    this.setState({ activeKey });
    history.push(activeKey);
  };

  onEdit = (targetKey: any) => {
    const { defaultRoute } = this.props;
    if (targetKey === defaultRoute) {
      message.warn('默认页面不能关闭');
      return;
    }
    let { activeKey } = this.state;
    const { tabList } = this.state;
    if (tabList.length === 1) {
      return;
    }
    let lastIndex;
    tabList.forEach((pane, i) => {
      if (pane.path === targetKey) {
        lastIndex = i - 1;
      }
    });
    const panes = tabList.filter((pane) => pane.path !== targetKey);
    if (panes.length && activeKey === targetKey) {
      if (lastIndex && lastIndex >= 0) {
        activeKey = panes[lastIndex].path;
      } else {
        activeKey = panes[0].path;
      }
    }
    history.push(activeKey);
    this.setState({ tabList: panes, activeKey });
  };

  /** 处理右键点击事件 */
  handleContextClick = (e: any, tab: ITab) => {
    e.preventDefault();
    const { activeKey, tabList } = this.state;
    const disable = tabList.length === 1;
    const contextMenu = (
      <Menu selectable={false} onClick={({ key: action }) => this.handleMenuClick(action, tab)}>
        {activeKey === tab.path && (
          <Menu.Item key="refresh">
            <SyncOutlined /> 刷新
          </Menu.Item>
        )}
        <Menu.Item key="closeOther" disabled={disable}>
          <CloseCircleOutlined /> 关闭其他
        </Menu.Item>
      </Menu>
    );

    this.setState({
      contextVisible: true,
      contextEvent: { clientX: e.clientX, clientY: e.clientY },
      contextMenu,
    });
  };

  /** 处理右键菜单事件 */
  handleMenuClick = (action: React.Key, tab: ITab) => {
    if (action === 'refresh') {
      this.handleRefreshClick();
    } else if (action === 'closeOther') {
      const { tabList } = this.state;
      history.push(tab.path);
      this.setState({
        activeKey: tab.path,
        tabList: tab.pathname === '/home' ? [tab] : [tabList[0], tab],
      });
    }
  };

  handleRefreshClick = () => {
    const { activeKey, tabList } = this.state;
    const tab = _.find(tabList, { path: activeKey });
    if (tab) {
      tab.isRefresh = true;
      this.setState({ tabList: [...tabList] }, () => {
        this.refreshCurTab();
      });
    }
  };

  /** 刷新当前展示的tab页，思路先移除tab的组件，然后再添加上 */
  refreshCurTab = () => {
    const { tabList, activeKey } = this.state;
    const tab = _.find(tabList, { isRefresh: true, path: activeKey });
    if (tab) {
      tab.isRefresh = false;
      this.setState({
        tabList: [...tabList],
      });
    }
  };

  render() {
    const { tabList, activeKey, contextVisible, contextEvent, contextMenu } = this.state;
    const { permissionLoading } = this.props;
    return (
      <>
        <ContextMenu
          visible={contextVisible}
          onChange={(visible: boolean) => this.setState({ contextVisible: visible })}
          event={contextEvent}
          content={contextMenu}
        />
        <Tabs
          type="editable-card"
          hideAdd
          tabBarStyle={{
            margin: 0,
            padding: '13px 24px 0 24px',
            borderColor: '#D9D9D9',
            backgroundColor: '#fff',
          }}
          activeKey={activeKey}
          onEdit={this.onEdit}
          onChange={this.onChange}
          animated={false}
        >
          {tabList.map((item) => {
            return (
              <TabPane
                key={item.path}
                style={{ padding: 24, backgroundColor: '#F8F8FA' }}
                tab={
                  <span
                    onContextMenu={(e) => this.handleContextClick(e, item)}
                    style={{ display: 'inline-block' }}
                  >
                    {item.tabName || this.routesNameMap[item.pathname]?.title}
                  </span>
                }
              >
                <Skeleton loading={!!permissionLoading} active>
                  <Route
                    component={item.isRefresh ? null : this.routesNameMap[item.pathname]?.component}
                  />
                </Skeleton>
              </TabPane>
            );
          })}
        </Tabs>
      </>
    );
  }
}

export default TabPages;
