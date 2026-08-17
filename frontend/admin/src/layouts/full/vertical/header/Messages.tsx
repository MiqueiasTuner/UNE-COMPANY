'use client';

import { Icon } from '@iconify/react';
import * as MessagesData from './data';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { Link } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';

const Messages = () => {
  return (
    <div className="relative group/menu px-4 sm:px-15 ">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="relative">
            <span className="relative after:absolute after:w-10 after:h-10 after:rounded-full hover:text-primary after:-top-1/2 hover:after:bg-lightprimary text-foreground dark:text-muted-foreground rounded-full flex justify-center items-center cursor-pointer group-hover/menu:after:bg-lightprimary group-hover/menu:!text-primary">
              <Icon icon="tabler:bell-ringing" height={20} />
            </span>
            <span className="rounded-full absolute -end-[6px] -top-[5px] text-[10px] h-2 w-2 bg-primary flex justify-center items-center"></span>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-screen sm:w-[300px] py-6 rounded-sm border border-ld"
        >
          <div className="flex items-center px-6 justify-between">
            <h3 className="mb-0 text-lg font-semibold text-ld">Notificações</h3>
            <Badge className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">
              {MessagesData.Notification.length} novas
            </Badge>
          </div>

          <SimpleBar className="max-h-80 mt-3">
            {MessagesData.Notification.map((links, index) => (
              <DropdownMenuItem
                className="px-6 py-3 flex justify-between items-center bg-hover group/link w-full"
                key={index}
              >
                <Link to="#" className="w-full">
                  <div className="flex items-center">
                    <span className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${links.bgcolor} ${links.color}`}>
                      <Icon icon={links.icon} width={22} />
                    </span>
                    <div className="ps-4 flex-1 min-w-0">
                      <h5 className="mb-0.5 text-xs font-bold text-foreground truncate group-hover/link:text-primary">{links.title}</h5>
                      <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
                        {links.subtitle}
                      </p>
                      <span className="text-[9px] text-muted-foreground block mt-1 font-semibold">
                        {links.time}
                      </span>
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </SimpleBar>

          <div className="pt-5 px-6">
            <Button variant={'outline'} className="w-full text-xs font-bold">
              Ver Todas Notificações
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Messages;
