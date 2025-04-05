import { Routes } from '@angular/router';
import { PresenterPage } from './presenter/presenter.page';
import { SlideshowPage } from './slideshow/slideshow.page';
import { RemotePage } from './remote/remote.page';

export const routes: Routes = [
    {path: "", component: PresenterPage},
    {path: "slideshow", component: SlideshowPage},
    {path: "remote", component: RemotePage},
];
