import {aligned} from "./machine.js";
export function createEntryState(){return {power:true,axes:[0,0,0],contacts:[false,false,false],sliders:[0,100]};}
export function panelSolved(s){return [aligned(s.axes),s.contacts.length===3&&s.contacts.every(Boolean),Math.abs(s.sliders[0]-30)<=5&&Math.abs(s.sliders[1]-70)<=5];}
export function entryOpen(s){return panelSolved(s).every(Boolean);}
export function operate(s,kind,index,value){
 if(!Number.isInteger(index)||index<0)return;
 if(kind==="axis"&&index<3)s.axes[index]=(s.axes[index]+1)%4;
 if(kind==="contact"&&index<3)s.contacts[index]=!s.contacts[index];
 if(kind==="slider"&&index<2&&Number.isFinite(value))s.sliders[index]=Math.max(0,Math.min(100,value));
}
